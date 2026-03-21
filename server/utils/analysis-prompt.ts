export interface AnalysisInput {
  vacancy: {
    company: string
    position: string
    notes: string | null
  }
  recruiters: Array<{
    name: string
    telegram: string | null
    email: string | null
  }>
  messages: Array<{
    direction: 'in' | 'out'
    content: string
    sentAt: string
    source: string
  }>
}

export type PromptLang = 'uk' | 'en'

export function buildAnalysisPrompt(input: AnalysisInput, lang: PromptLang = 'uk'): string {
  const { vacancy, recruiters, messages } = input

  const sortedMessages = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt))

  if (lang === 'en') {
    const recruiterList = recruiters.length
      ? recruiters.map(r => `- ${r.name}${r.telegram ? ` (Telegram: ${r.telegram})` : ''}${r.email ? ` (Email: ${r.email})` : ''}`).join('\n')
      : '- (no recruiters)'

    const messageThread = sortedMessages.length
      ? sortedMessages.map(m => `[${m.sentAt.slice(0, 16)} ${m.direction === 'out' ? '→' : '←'} ${m.source}] ${m.content}`).join('\n')
      : '(no messages)'

    return `You are a job market analyst. Analyze this job vacancy and the recruiter conversation.

## Vacancy
Company: ${vacancy.company}
Position: ${vacancy.position}
Notes: ${vacancy.notes ?? '(none)'}

## Recruiters
${recruiterList}

## Conversation
${messageThread}

Reply with ONLY valid JSON, no markdown, no explanation:
{
  "company_score": <number 0-10, company attractiveness>,
  "recruiter_score": <number 0-10, recruiter quality>,
  "red_flags": ["string", ...],
  "green_flags": ["string", ...],
  "summary": "<2-3 sentence overall summary>"
}`
  }

  // Ukrainian (default)
  const recruiterList = recruiters.length
    ? recruiters.map(r => `- ${r.name}${r.telegram ? ` (Telegram: ${r.telegram})` : ''}${r.email ? ` (Email: ${r.email})` : ''}`).join('\n')
    : '- (немає рекрутерів)'

  const messageThread = sortedMessages.length
    ? sortedMessages.map(m => `[${m.sentAt.slice(0, 16)} ${m.direction === 'out' ? '→' : '←'} ${m.source}] ${m.content}`).join('\n')
    : '(немає повідомлень)'

  return `Ти аналітик ринку праці. Проаналізуй цю вакансію та переписку з рекрутерами.

## Вакансія
Компанія: ${vacancy.company}
Посада: ${vacancy.position}
Нотатки: ${vacancy.notes ?? '(немає)'}

## Рекрутери
${recruiterList}

## Переписка
${messageThread}

Відповідай ТІЛЬКИ валідним JSON, без markdown, без пояснень:
{
  "company_score": <число 0-10, оцінка привабливості компанії>,
  "recruiter_score": <число 0-10, оцінка якості рекрутера>,
  "red_flags": ["рядок", ...],
  "green_flags": ["рядок", ...],
  "summary": "<загальне резюме 2-3 речення>"
}`
}
