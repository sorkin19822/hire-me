import { useDatabase } from '../../database/index'
import { settings } from '../../database/schema'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
    authorizationParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  },

  async onSuccess(event, { tokens }) {
    const refreshToken = (tokens as Record<string, unknown>).refresh_token as string | undefined

    if (refreshToken) {
      const db = useDatabase()
      db.insert(settings)
        .values({ key: 'google_drive_refresh_token', value: refreshToken })
        .onConflictDoUpdate({ target: settings.key, set: { value: refreshToken } })
        .run()
    }

    return sendRedirect(event, '/settings?drive=connected')
  },

  onError(event, error) {
    console.error('[auth/google-drive] OAuth error:', error)
    return sendRedirect(event, '/settings?drive=error')
  }
})
