import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { Readable } from 'node:stream'

export interface EmailMessage {
  messageId: string
  subject: string
  body: string
  date: string // ISO 8601
  direction: 'in' | 'out'
}

function createImap(config: { host: string, port: number, user: string, password: string }): Imap {
  return new Imap({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 15000,
    connTimeout: 15000
  })
}

function connect(imap: Imap): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.once('ready', resolve)
    imap.once('error', reject)
    imap.connect()
  })
}

function openBox(imap: Imap, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.openBox(name, true, (err) => err ? reject(err) : resolve())
  })
}

function searchUids(imap: Imap, criteria: unknown[]): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, uids) => err ? reject(err) : resolve(uids))
  })
}

function fetchMessage(imap: Imap, uid: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const f = imap.fetch([uid], { bodies: '', struct: false })
    let raw = ''
    f.on('message', (msg) => {
      msg.on('body', (stream: NodeJS.ReadableStream) => {
        stream.on('data', (chunk: Buffer) => { raw += chunk.toString() })
      })
      msg.once('end', () => resolve(raw))
    })
    f.once('error', reject)
  })
}

async function fetchFromFolder(
  imap: Imap,
  folder: string,
  emailAddress: string,
  direction: 'in' | 'out'
): Promise<EmailMessage[]> {
  try {
    await openBox(imap, folder)
  } catch {
    return []
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const since = new Date()
  since.setMonth(since.getMonth() - 6)
  const sinceStr = `${String(since.getDate()).padStart(2, '0')}-${months[since.getMonth()]}-${since.getFullYear()}`

  const addressCriterion = direction === 'in' ? ['FROM', emailAddress] : ['TO', emailAddress]

  let uids: number[]
  try {
    uids = await searchUids(imap, [addressCriterion, ['SINCE', sinceStr]])
  } catch {
    return []
  }

  if (!uids.length) return []

  const results: EmailMessage[] = []

  for (const uid of uids) {
    try {
      const raw = await fetchMessage(imap, uid)
      const parsed = await simpleParser(Readable.from(raw))

      const date = parsed.date ? parsed.date.toISOString() : new Date().toISOString()
      const subject = parsed.subject ?? ''
      const body = parsed.text?.trim() ?? ''
      const messageId = (typeof parsed.messageId === 'string' ? parsed.messageId : '') ||
        `${date}::${emailAddress}::${subject}`

      if (!body && !subject) continue

      results.push({ messageId, subject, body, date, direction })
    } catch {
      // Skip unparseable messages
    }
  }

  return results
}

async function fetchEmailsInternal(
  emailAddress: string,
  config: { host: string, port: number, user: string, password: string }
): Promise<EmailMessage[]> {
  const imap = createImap(config)

  try {
    await connect(imap)
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[imap] connection failed:', msg)
    throw new Error(msg)
  }

  try {
    const inbox = await fetchFromFolder(imap, 'INBOX', emailAddress, 'in')
    let sent = await fetchFromFolder(imap, 'Sent', emailAddress, 'out')
    if (!sent.length) {
      sent = await fetchFromFolder(imap, 'Надіслані', emailAddress, 'out')
    }
    return [...inbox, ...sent]
  } finally {
    try { imap.end() } catch { /* ignore */ }
  }
}

export function fetchEmailsByAddress(
  emailAddress: string,
  config: { host: string, port: number, user: string, password: string }
): Promise<EmailMessage[]> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('IMAP timeout after 60s')), 60000)
  )
  return Promise.race([fetchEmailsInternal(emailAddress, config), timeout])
}
