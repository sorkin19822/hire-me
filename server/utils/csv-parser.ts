export interface ParsedVacancy {
  company: string
  position: string
  recruiterTelegram: string | null
  applyDate: string | null
  stageName: string
  notes: string | null
}

// ─── Stage mapping ────────────────────────────────────────────────────────────

export function mapStageName(raw: string): string {
  const s = raw.trim().toLowerCase()

  if (!s) return 'Відгук'
  if (s.startsWith('@')) return 'Відгук' // telegram username in stage column

  // Terminal / rejection
  if (
    s.includes('відмов')
    || s.includes('отказ')
    || s.includes('історія')
    || s.includes('берут за пределами')
    || s.includes('b2')
  )
    return 'Відмова'

  // Offer
  if (s.includes('предложил') || s.includes('оффер') || s.includes('offer')) return 'Оффер'

  // CTO / Director
  if (s.includes('директор') || s.includes('cto')) return 'CTO'

  // HR interview (text or date-based)
  if (s.includes('співбесід') || s.includes('hr') || s.includes('собеседован')) return 'HR'

  // Date pattern DD.MM.YYYY — recruiter scheduled something
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw.trim())) return 'HR'

  return 'Відгук'
}

// ─── Date normalization ───────────────────────────────────────────────────────

export function normalizeDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

// ─── Telegram extractor ───────────────────────────────────────────────────────

export function extractTelegram(fields: string[]): string | null {
  for (const field of fields) {
    const match = field.match(/@([A-Za-z0-9_]{3,32})/)
    if (match) return match[0]
  }
  return null
}

// ─── CSV content parser (handles quoted multiline cells) ─────────────────────

export function parseCSVContent(content: string): string[][] {
  const rows: string[][] = []
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  let i = 0
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  while (i < lines.length) {
    const ch = lines[i]

    if (inQuotes) {
      if (ch === '"') {
        if (lines[i + 1] === '"') {
          // Escaped quote
          currentField += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      }
      currentField += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === ',') {
      currentRow.push(currentField)
      currentField = ''
      i++
      continue
    }

    if (ch === '\n') {
      currentRow.push(currentField)
      rows.push(currentRow)
      currentRow = []
      currentField = ''
      i++
      continue
    }

    currentField += ch
    i++
  }

  // Last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  return rows
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parseVacanciesCSV(content: string): ParsedVacancy[] {
  const rows = parseCSVContent(content)
  const results: ParsedVacancy[] = []

  for (const row of rows) {
    // Skip rows with insufficient columns
    if (row.length < 4) continue

    const company = row[0].trim().replace(/;+$/, '')
    if (!company) continue

    // col[1]: take only the first line of position
    const position = (row[1] ?? '').split('\n')[0].trim()
    if (!position) continue

    const rawDate = row[3] ?? ''
    const applyDate = normalizeDate(rawDate)

    const rawStage = row[4] ?? ''
    const stageName = mapStageName(rawStage)

    // Build notes: preserve original stage text if it carries information
    const stageHasInfo = rawStage.trim() && !rawStage.trim().startsWith('@')
    const extraNotes = row.slice(5).filter(c => c.trim())
    const noteParts: string[] = []
    if (stageHasInfo && stageName === 'Відгук') noteParts.push(rawStage.trim())
    if (extraNotes.length) noteParts.push(...extraNotes)
    const notes = noteParts.length ? noteParts.join('\n') : null

    // Telegram: check col[4] (may be @username) and col[2] and col[5..10]
    const recruiterTelegram = extractTelegram([rawStage, row[2] ?? '', ...row.slice(5)])

    results.push({ company, position, recruiterTelegram, applyDate, stageName, notes })
  }

  return results
}
