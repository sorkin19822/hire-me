import { z } from 'zod'
import { getTelegramClient, saveTelegramSession, loadSetting } from '../../../utils/telegram-client'

const schema = z.object({
  code: z.string().min(4).max(10),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const { code } = parsed.data

  const phoneNumber = loadSetting('telegram_phone')
  const phoneCodeHash = loadSetting('telegram_phone_code_hash')

  if (!phoneNumber || !phoneCodeHash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No pending auth session — call /auth first to request a code',
    })
  }

  try {
    const { client, Api } = await getTelegramClient()
    await client.invoke(
      new Api.auth.SignIn({ phoneNumber, phoneCodeHash, phoneCode: code }),
    )
    await saveTelegramSession(client.session.save() as string)
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[telegram/verify] SignIn failed:', msg)
    // Surface Telegram-level errors (PHONE_CODE_INVALID, SESSION_PASSWORD_NEEDED, etc.)
    throw createError({ statusCode: 401, statusMessage: `Telegram auth failed: ${msg}` })
  }

  return { connected: true }
})
