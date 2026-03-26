import { z } from 'zod'
import { useDatabase } from '../../../database/index'
import { vacancies, settings } from '../../../database/schema'
import { eq } from 'drizzle-orm'
import { createCalendarClient } from '../../../utils/google-calendar'

const bodySchema = z.object({
  startDateTime: z.string(),
  durationMinutes: z.coerce.number().int().min(1).max(480).default(60),
  title: z.string().max(200).optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid body' })

  const { startDateTime, durationMinutes, title } = parsed.data

  const db = useDatabase()
  const [vacancy] = db.select().from(vacancies).where(eq(vacancies.id, id)).all()
  if (!vacancy) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

  const [tokenRow] = db.select().from(settings).where(eq(settings.key, 'google_drive_refresh_token')).all()
  if (!tokenRow?.value) throw createError({ statusCode: 400, statusMessage: 'Google not connected. Authorize via Settings → Google Drive.' })

  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET ?? ''

  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Google OAuth not configured.' })
  }

  const calendar = createCalendarClient(clientId, clientSecret, tokenRow.value)

  // Parse as UTC for arithmetic, then strip the Z so Google Calendar
  // treats the string as-is in the given timeZone (Europe/Kyiv).
  const startMs = new Date(startDateTime).getTime()
  const endMs = startMs + durationMinutes * 60 * 1000
  const startLocal = new Date(startMs).toISOString().slice(0, 19)
  const endLocal = new Date(endMs).toISOString().slice(0, 19)

  const calEvent = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title ?? `Співбесіда — ${vacancy.company}`,
      description: `Позиція: ${vacancy.position}`,
      start: { dateTime: startLocal, timeZone: 'Europe/Kyiv' },
      end: { dateTime: endLocal, timeZone: 'Europe/Kyiv' },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 }]
      }
    }
  })

  return { htmlLink: calEvent.data.htmlLink }
})
