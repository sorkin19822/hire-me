import { z } from 'zod'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'
import { useDatabase } from '../../database/index'
import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
})

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = hashPassword(password, salt)
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email or password format' })
  }

  const { email, password } = parsed.data
  const emailLower = email.toLowerCase()

  const config = useRuntimeConfig(event)
  const allowedEmails = (config.allowedEmails as string)
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (!allowedEmails.includes(emailLower)) {
    throw createError({ statusCode: 403, statusMessage: 'Email not allowed' })
  }

  const db = useDatabase()
  const [user] = db.select().from(users).where(eq(users.email, emailLower)).all()

  if (!user) {
    // First-time login — register with this password
    const salt = randomBytes(16).toString('hex')
    const hash = hashPassword(password, salt)
    db.insert(users).values({
      email: emailLower,
      passwordHash: `${salt}:${hash}`
    }).run()

    await setUserSession(event, { user: { email: emailLower, name: emailLower } })
    return { ok: true }
  }

  if (!user.passwordHash) {
    // User exists (created via Google) but has no password yet — set it now
    const salt = randomBytes(16).toString('hex')
    const hash = hashPassword(password, salt)
    db.update(users).set({ passwordHash: `${salt}:${hash}` }).where(eq(users.email, emailLower)).run()

    await setUserSession(event, { user: { email: emailLower, name: user.name ?? emailLower, avatar: user.avatar ?? undefined } })
    return { ok: true }
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  await setUserSession(event, { user: { email: emailLower, name: user.name ?? emailLower, avatar: user.avatar ?? undefined } })
  return { ok: true }
})
