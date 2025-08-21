import { GoogleAuth, OAuth2Client } from 'google-auth-library'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
]

export interface GoogleTokens {
  access_token?: string | null
  refresh_token?: string | null
  scope?: string
  token_type?: string
  expiry_date?: number | null
}

export function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  })
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent'
  })
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export function validateGoogleAuthConfig(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  )
}

export function createOAuth2ClientWithTokens(tokens: GoogleTokens): OAuth2Client {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

export async function refreshTokenIfNeeded(tokens: GoogleTokens): Promise<GoogleTokens> {
  if (!tokens.refresh_token) {
    throw new Error('No refresh token available')
  }

  const oauth2Client = createOAuth2ClientWithTokens(tokens)
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    return {
      ...tokens,
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw new Error('Failed to refresh access token')
  }
}