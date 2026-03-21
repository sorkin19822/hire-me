import type { H3Event } from 'h3'

/**
 * Require authenticated session + ALLOWED_EMAILS whitelist.
 * Throws 401 if no session, 403 if email not in whitelist.
 */
export async function requireAuth(event: H3Event) {
  const session = await requireUserSession(event)

  const config = useRuntimeConfig(event)
  const allowedEmails = (config.allowedEmails as string)
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  // Fail-closed: if whitelist is empty, deny all access (misconfiguration)
  if (allowedEmails.length === 0) {
    console.error('[auth] ALLOWED_EMAILS is not configured — all access denied')
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const email = (session.user as { email?: string })?.email?.toLowerCase() ?? ''
  if (!allowedEmails.includes(email)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: email not in allowed list' })
  }

  return session
}
