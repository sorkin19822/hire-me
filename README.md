# hire-me — Job Search CRM

Personal CRM for tracking vacancies, interviews and recruiter conversations with AI analysis.

## Stack

- **Nuxt 4** + Vue 3 + TypeScript
- **Nuxt UI v4** + Tailwind CSS v4
- **SQLite** + Drizzle ORM + better-sqlite3
- **Google OAuth** via nuxt-auth-utils
- **Claude API** for AI analysis
- **Telegram MCP** + IMAP (ukr.net) for message sync

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: NUXT_OAUTH_GOOGLE_CLIENT_ID, NUXT_SESSION_PASSWORD, ALLOWED_EMAILS, etc.

# 3. Run DB migrations + seed
npm run db:migrate
npm run db:seed

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker

```bash
# Production (port 3000)
docker compose --profile prod up -d

# Development — live reload + HMR (port 3000)
docker compose --profile dev up

# Stop all containers
docker compose down
```

> Профілі `prod` і `dev` не можна запускати одночасно — обидва використовують порт 3000.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed default pipeline stages |
| `npm run db:studio` | Open Drizzle Studio |

## Environment Variables

See [.env.example](.env.example) for all required variables.

Key variables:
- `DATABASE_URL` — SQLite file path (default: `./data/hire-me.db`)
- `NUXT_OAUTH_GOOGLE_CLIENT_ID/SECRET` — Google OAuth credentials
- `NUXT_SESSION_PASSWORD` — Session encryption key (min 32 chars)
- `ALLOWED_EMAILS` — Comma-separated whitelist of allowed emails
- `ANTHROPIC_API_KEY` — Claude API key for AI analysis

## Features

- **Kanban board** — drag-and-drop vacancies across pipeline stages
- **CSV import** — bulk import from Google Sheets (89 vacancies)
- **Recruiter CRM** — contacts with Telegram + email sync
- **Message timeline** — unified view of all recruiter conversations
- **AI analysis** — company + recruiter analysis via Claude API
- **Analytics** — funnel chart, Gantt timeline, stats
- **Google Drive** — CV version management
