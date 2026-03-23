import { useDatabase } from '../../database/index'
import { users } from '../../database/schema'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    const config = useRuntimeConfig(event)
    const allowedEmails = (config.allowedEmails as string)
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const email = (googleUser.email as string | undefined)?.toLowerCase() ?? ''

    if (allowedEmails.length === 0 || !allowedEmails.includes(email)) {
      return sendRedirect(event, '/login?error=unauthorized')
    }

    // Upsert user in DB
    const db = useDatabase()
    // better-sqlite3 is synchronous — .run() completes before continuing
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
