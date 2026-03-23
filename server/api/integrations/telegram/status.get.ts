import { loadSetting } from '../../../utils/telegram-client'
import { createRequire } from 'node:module'

const _require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { TelegramClient } = _require('telegram') as { TelegramClient: any }

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const sessionStr = loadSetting('telegram_session')
  if (!sessionStr) {
    return { connected: false }
  }

  // Attempt a lightweight check — if the client singleton is already up, it's connected.
  // We avoid creating a new full client just for a status check to prevent auth floods.
  // Instead we inspect the module-level singleton via a lazy import.
  let connected = false
  try {
    const { getTelegramClient } = await import('../../../utils/telegram-client')
    const { client } = await getTelegramClient()
    connected = !!client?.connected
  }
  catch {
    connected = false
  }

  return { connected }
})
