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

export const ANALYSIS_SYSTEM_PROMPT =
  'Ти аналітик ринку праці. Відповідай тільки валідним JSON без markdown.'

export function buildAnalysisPrompt(input: AnalysisInput): string {
  const { vacancy, recruiters, messages } = input

  const recruiterList = recruiters.length
    ? recruiters.map(r => `- ${r.name}${r.telegram ? ` (Telegram: ${r.telegram})` : ''}${r.email ? ` (Email: ${r.email})` : ''}`).join('\n')
    : '- (немає рекрутерів)'

  const messageThread = messages.length
    ? messages
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
        .map(m => `[${m.sentAt.slice(0, 16)} ${m.direction === 'out' ? '→' : '←'} ${m.source}] ${m.content}`)
        .join('\n')
    : '(немає повідомлень)'

  return `Проаналізуй цю вакансію та переписку з рекрутерами.

## Вакансія
Компанія: ${vacancy.company}
Посада: ${vacancy.position}
Нотатки: ${vacancy.notes ?? '(немає)'}

## Рекрутери
${recruiterList}

## Переписка
${messageThread}

Поверни JSON такого формату:
{
  "company_score": <число 0-10, оцінка привабливості компанії>,
  "recruiter_score": <число 0-10, оцінка якості рекрутера>,
  "red_flags": [<рядок>, ...],
  "green_flags": [<рядок>, ...],
  "summary": "<загальне резюме 2-3 речення>"
}`
}
