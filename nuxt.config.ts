// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  // All server-side only — never exposed to client bundle
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || './data/hire-me.db',
    allowedEmails: process.env.ALLOWED_EMAILS || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    imapHost: process.env.IMAP_HOST || 'imap.ukr.net',
    imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
    imapUser: process.env.IMAP_USER || '',
    imapPassword: process.env.IMAP_PASSWORD || '',
    googleDriveMcpUrl: process.env.GOOGLE_DRIVE_MCP_URL || '',
    telegramMcpUrl: process.env.TELEGRAM_MCP_URL || '',
    public: {}
  },

  nitro: {
    // Required for better-sqlite3 native module
    externals: {
      inline: ['better-sqlite3', 'imap-simple', 'imap', 'utf8', 'uuencode', 'quoted-printable', 'iconv-lite']
    }
  },

  typescript: {
    strict: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
