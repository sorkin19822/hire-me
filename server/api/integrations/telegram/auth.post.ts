import { z } from 'zod'
import { getTelegramClient, saveSetting } from '../../../utils/telegram-client'

const schema = z.object({
  phone: z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format, e.g. +380501234567')
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const { phone } = parsed.data
  const config = useRuntimeConfig(event)
  const apiId = Number(config.telegramApiId)
  const apiHash = config.telegramApiHash as string

  let result: { phoneCodeHash: string }
  try {
    const { client } = await getTelegramClient()
    result = await client.sendCode({ apiId, apiHash }, phone) as { phoneCodeHash: string }
  } catch (err) {
    console.error('[telegram/auth] sendCode failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to send Telegram auth code' })
  }

  // Persist phone + hash so the verify endpoint can use them
  saveSetting('telegram_phone', phone)
  saveSetting('telegram_phone_code_hash', result.phoneCodeHash)

  return { sent: true }
})
