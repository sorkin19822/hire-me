# hire-me — Job Search CRM

> Personal CRM for active job seekers. Track vacancies, manage recruiter conversations, sync messages from Telegram and email, and get AI-powered analysis of companies and recruiters.

Built for 1–3 users who are actively job hunting and want to stay organized across many parallel applications.

---

## What it does

When you're applying to 20–50 companies simultaneously, things get out of hand fast: you forget which stage you're at, lose recruiter contacts, can't find that message from 2 weeks ago. **hire-me** solves this by keeping everything in one place.

### Kanban pipeline
Vacancies move through stages: New → CV Sent → Interview → Offer → Rejected, etc. Drag and drop between stages. Stages are configurable and stored in the database.

### Vacancy list
Sortable, searchable table with filtering by stage. Pagination with configurable rows per page (10 / 25 / 50 / 100).

### Vacancy detail page
Each vacancy has:
- **Company + position** — inline editable
- **Apply date** — calendar picker
- **Links** — vacancy URL and company site
- **CV version** — which resume you sent (with preview)
- **Job description** — rich text editor (bold, italic, underline, headings, lists, blockquote, code); paste HTML directly from job boards
- **Notes** — personal observations (5000 char limit with counter)
- **Stage progress tracker** — horizontal dot indicator, independent of the stage selector. Click a dot to activate it, click again to open a popover with status (Waiting / Passed / Failed) and a short comment. Hover shows the comment as a tooltip.
- **Recruiters** — contacts with Telegram, email, LinkedIn
- **Message timeline** — full conversation history
- **AI analysis** — company and recruiter evaluation

### Message sync
- **Telegram** — connects via MTProto (GramJS), fetches full dialog with a recruiter by their username
- **Email** — fetches from IMAP (ukr.net), matches by recruiter email
- **Manual** — add any message with custom date/time

### CV versions
Upload multiple versions of your resume (PDF or DOCX), add comments to each ("with cover letter", "short version"), attach a specific version to each vacancy, preview in browser.

### AI analysis
Generates a detailed prompt with all available context (vacancy text, recruiter info, full message history) → copy to claude.ai → paste the JSON response back. The app shows: company score 0–10, recruiter score 0–10, green flags, red flags, summary.

### Analytics
Funnel chart showing conversion between active pipeline stages (terminal stages like "Rejected" / "No response" are excluded from conversion percentages), Gantt timeline of applications over time, summary statistics.

### Settings
`/settings` page for managing integrations:
- **Telegram** — MTProto authentication (enter phone → receive SMS code → confirm)
- **Backup** — compressed SQLite backup to Google Drive (create, restore, delete)

---

## Stack

- **Nuxt 3** + Vue 3 + TypeScript
- **Nuxt UI v4** + Tailwind CSS v4
- **SQLite** + Drizzle ORM + better-sqlite3
- **Google OAuth** via nuxt-auth-utils (optional login method + Drive backup)
- **Claude API** for AI analysis
- **Telegram MTProto** (GramJS) + IMAP for message sync
- **googleapis** for Google Drive backup

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in credentials (see below)

# 3. Run DB migrations + seed pipeline stages
npm run db:migrate
npm run db:seed

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```bash
# Production (port 3000)
docker compose --profile prod up -d

# Development — live reload + HMR (port 3000)
docker compose --profile dev up

# Stop
docker compose down
```

> Profiles `prod` and `dev` cannot run simultaneously — both use port 3000.

---

## Environment Variables

See [.env.example](.env.example) for all variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `NUXT_DATABASE_URL` | — | SQLite file path (default: `./data/hire-me.db`) |
| `NUXT_SESSION_PASSWORD` | ✓ | Session encryption key (min 32 chars) |
| `NUXT_ALLOWED_EMAILS` | ✓ | Comma-separated whitelist of allowed emails |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | — | Google OAuth client ID (login + Drive backup) |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `NUXT_GOOGLE_BACKUP_FOLDER_ID` | — | Google Drive folder ID for backups |
| `NUXT_ANTHROPIC_API_KEY` | — | Claude API key (AI analysis feature) |
| `NUXT_IMAP_HOST` | — | IMAP host (default: `imap.ukr.net`) |
| `NUXT_IMAP_USER` | — | IMAP email address |
| `NUXT_IMAP_PASSWORD` | — | IMAP app-specific password |
| `TELEGRAM_API_ID` | — | Telegram app ID from [my.telegram.org](https://my.telegram.org/apps) |
| `TELEGRAM_API_HASH` | — | Telegram app hash |

---

## Integrations Setup

### Google OAuth credentials (required for login and/or Drive backup)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → select your project
2. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google` — if using Google login
   - `http://localhost:3000/auth/google-drive` — for Drive backup
5. Copy **Client ID** and **Client Secret** → paste into `.env`

### Google Drive Backup setup

1. **Enable Drive API**: [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Enable APIs and Services** → search "Google Drive API" → Enable
2. **Create a folder** on [drive.google.com](https://drive.google.com), copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/<THIS_IS_THE_FOLDER_ID>
   ```
3. Add to `.env`:
   ```env
   NUXT_GOOGLE_BACKUP_FOLDER_ID=<folder_id>
   ```
4. Restart the container
5. In the app: **Settings → Резервне копіювання → Підключити Google Drive** → authorize in Google → done

After authorization the backup section shows a **"Налаштовано"** badge. Available actions:
- **Створити резервну копію** — compresses the SQLite DB and uploads `.db.gz` to Drive
- **↺** — restore DB from a selected backup (requires page reload after)
- **🗑** — delete backup file from Drive

### Telegram setup

1. Go to [my.telegram.org/apps](https://my.telegram.org/apps)
2. Create a new application
3. Copy `api_id` and `api_hash` to `.env`
4. In the app: **Settings → Telegram → enter phone number → confirm SMS code**

### Email IMAP setup (ukr.net)

1. Log into ukr.net → Account settings → **App passwords** → create a new password
2. Add to `.env`:
   ```env
   NUXT_IMAP_USER=your@ukr.net
   NUXT_IMAP_PASSWORD=<app_password>
   ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle migration from schema diff |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed default pipeline stages |
| `npm run db:studio` | Open Drizzle Studio |
