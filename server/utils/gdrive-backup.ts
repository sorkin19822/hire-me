import { google } from 'googleapis'

export function createDriveClientOAuth(
  clientId: string,
  clientSecret: string,
  refreshToken: string
) {
  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })
  return google.drive({ version: 'v3', auth })
}
