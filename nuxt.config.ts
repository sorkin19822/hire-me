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
    // Defaults — all overridable at runtime via NUXT_<KEY_UPPERCASE> env vars
    databaseUrl: './data/hire-me.db',
    allowedEmails: '',
    anthropicApiKey: '',
    imapHost: 'imap.ukr.net',
    imapPort: 993,
    imapUser: '',
    imapPassword: '',
    googleDriveMcpUrl: '',
    telegramMcpUrl: '',
    telegramApiId: process.env.TELEGRAM_API_ID ?? '',
    telegramApiHash: process.env.TELEGRAM_API_HASH ?? '',
    public: {}
  },

  vite: {
    optimizeDeps: {
      include: ['reka-ui']
    }
  },

  nitro: {
    // Required for better-sqlite3 and GramJS (CJS native/non-standard modules)
    externals: {
      inline: ['imap-simple', 'imap', 'utf8', 'uuencode', 'quoted-printable', 'iconv-lite'],
      external: ['telegram']
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
