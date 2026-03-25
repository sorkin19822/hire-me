import { useDatabase } from '../../database/index'
import { users, settings } from '../../database/schema'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
    authorizationParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  },

  async onSuccess(event, { user: googleUser, tokens }) {
    const config = useRuntimeConfig(event)
    const allowedEmails = (config.allowedEmails as string)
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const email = (googleUser.email as string | undefined)?.toLowerCase() ?? ''

    if (allowedEmails.length === 0 || !allowedEmails.includes(email)) {
      return sendRedirect(event, '/login?error=unauthorized')
    }

    const db = useDatabase()

    db.insert(users)
      .values({
        email,
        name: googleUser.name as string ?? null,
        avatar: googleUser.picture as string ?? null
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: googleUser.name as string ?? null,
          avatar: googleUser.picture as string ?? null
        }
      })
      .run()

    // Save Google Drive refresh token for backup feature
    const refreshToken = (tokens as Record<string, unknown>).refresh_token as string | undefined
    if (refreshToken) {
      db.insert(settings)
        .values({ key: 'google_drive_refresh_token', value: refreshToken })
        .onConflictDoUpdate({ target: settings.key, set: { value: refreshToken } })
        .run()
    }

    await setUserSession(event, {
      user: {
        email,
        name: googleUser.name as string ?? null,
        avatar: googleUser.picture as string ?? null
      }
    })

    return sendRedirect(event, '/')
  },

  onError(event, error) {
    console.error('[auth/google] OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  }
})
