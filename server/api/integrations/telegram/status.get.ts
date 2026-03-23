import { loadSetting } from '../../../utils/telegram-client'

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
  } catch {
    connected = false
  }

  return { connected }
})
