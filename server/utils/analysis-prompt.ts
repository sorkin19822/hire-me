export interface AnalysisInput {
  vacancy: {
    company: string
    position: string
    applyDate: string | null
    urlDou: string | null
    urlSite: string | null
    description: string | null
    notes: string | null
  }
  recruiters: Array<{
    name: string
    telegram: string | null
    email: string | null
    linkedin: string | null
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

  const recruiterList = recruiters.length
    ? recruiters.map(r => [
        `- ${r.name}`,
        r.telegram ? `Telegram: ${r.telegram}` : '',
        r.email ? `Email: ${r.email}` : '',
        r.linkedin ? `LinkedIn: ${r.linkedin}` : '',
      ].filter(Boolean).join(', ')).join('\n')
    : lang === 'uk' ? '- (немає рекрутерів)' : '- (no recruiters)'

  const messageThread = sortedMessages.length
    ? sortedMessages.map(m => `[${m.sentAt.slice(0, 16)} ${m.direction === 'out' ? '→' : '←'} ${m.source}] ${m.content}`).join('\n')
    : lang === 'uk' ? '(немає повідомлень)' : '(no messages)'

  if (lang === 'en') {
    return `You are a job market analyst. Analyze this job vacancy and the recruiter conversation.

## Vacancy
Company: ${vacancy.company}
Position: ${vacancy.position}
Apply date: ${vacancy.applyDate ?? '(unknown)'}${vacancy.urlDou ? `\nVacancy URL: ${vacancy.urlDou}` : ''}${vacancy.urlSite ? `\nCompany site: ${vacancy.urlSite}` : ''}

## Job Description
${vacancy.description ?? '(not provided)'}

## Recruiters
${recruiterList}

## Conversation
${messageThread}
${vacancy.notes ? `\n## Notes\n${vacancy.notes}` : ''}

Reply with ONLY valid JSON, no markdown, no explanation:
{
  "company_score": <number 0-10, company attractiveness>,
  "recruiter_score": <number 0-10, recruiter professionalism>,
  "red_flags": ["string", ...],
  "green_flags": ["string", ...],
  "summary": "<2-3 sentence overall summary>"
}`
  }

  // Ukrainian (default)
  return `Ти аналітик ринку праці. Проаналізуй цю вакансію та переписку з рекрутерами.

## Вакансія
Компанія: ${vacancy.company}
Посада: ${vacancy.position}
Дата відгуку: ${vacancy.applyDate ?? '(невідомо)'}${vacancy.urlDou ? `\nПосилання на вакансію: ${vacancy.urlDou}` : ''}${vacancy.urlSite ? `\nСайт компанії: ${vacancy.urlSite}` : ''}

## Текст вакансії
${vacancy.description ?? '(не вказано)'}

## Рекрутери
${recruiterList}

## Переписка
${messageThread}
${vacancy.notes ? `\n## Нотатки\n${vacancy.notes}` : ''}

Відповідай ТІЛЬКИ валідним JSON, без markdown, без пояснень:
{
  "company_score": <число 0-10, оцінка привабливості компанії>,
  "recruiter_score": <число 0-10, оцінка професіоналізму рекрутера>,
  "red_flags": ["рядок", ...],
  "green_flags": ["рядок", ...],
  "summary": "<загальне резюме 2-3 речення>"
}`
}
