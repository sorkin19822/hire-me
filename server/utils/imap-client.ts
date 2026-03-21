// @ts-expect-error — imap-simple has no type declarations
import imapSimpleLib from 'imap-simple'

const imapSimple = imapSimpleLib as {
  connect: (config: object) => Promise<ImapConnection>
}

interface MessagePart {
  which: string
  size: number
  body: string | Record<string, string[]>
}

interface ImapMessage {
  attributes: { uid: number; date: Date }
  parts: MessagePart[]
}

interface ImapConnection {
  openBox: (folder: string) => Promise<unknown>
  search: (criteria: unknown[], options: object) => Promise<ImapMessage[]>
  end: () => void
}

export interface EmailMessage {
  messageId: string
  subject: string
  body: string
  date: string     // ISO 8601
  direction: 'in' | 'out'
}

function buildConfig(host: string, port: number, user: string, password: string) {
  return {
    imap: {
      host,
      port,
      user,
      password,
      tls: true,
      authTimeout: 10000,
    },
  }
}

function extractHeader(headers: Record<string, string[]>, name: string): string {
  return (headers[name.toLowerCase()] ?? [])[0] ?? ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchFromFolder(
  connection: ImapConnection,
  folder: string,
  emailAddress: string,
  direction: 'in' | 'out',
): Promise<EmailMessage[]> {
  try {
    await connection.openBox(folder)
  }
  catch {
    return []
  }

  // node-imap expects nested arrays for criteria
  const criterion = direction === 'in' ? [['FROM', emailAddress]] : [['TO', emailAddress]]

  let messages: ImapMessage[]
  try {
    messages = await connection.search(criterion, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)', 'TEXT'],
      struct: false,
    })
  }
  catch {
    return []
  }

  const results: EmailMessage[] = []

  for (const message of messages) {
    try {
      const headerPart = message.parts.find(p => p.which.startsWith('HEADER'))
      const textPart = message.parts.find(p => p.which === 'TEXT')

      const headers = (headerPart?.body ?? {}) as Record<string, string[]>
      const rawDate = extractHeader(headers, 'date')
      const subject = extractHeader(headers, 'subject') || '(no subject)'
      const rawMsgId = extractHeader(headers, 'message-id')

      const parsedDate = rawDate ? new Date(rawDate) : new Date()
      if (isNaN(parsedDate.getTime())) continue
      const date = parsedDate.toISOString()

      // Include subject in fallback to avoid same-second collisions
      const msgId = rawMsgId.trim() || `${date}::${emailAddress}::${subject}`

      const rawBody = typeof textPart?.body === 'string' ? textPart.body : ''
      const body = rawBody.toLowerCase().includes('<html')
        ? stripHtml(rawBody)
        : rawBody.trim()

      results.push({ messageId: msgId, subject, body, date, direction })
    }
    catch {
      // Skip unparseable messages
    }
  }

  return results
}

export async function fetchEmailsByAddress(
  emailAddress: string,
  config: { host: string; port: number; user: string; password: string },
): Promise<EmailMessage[]> {
  let connection: ImapConnection

  try {
    connection = await imapSimple.connect(buildConfig(config.host, config.port, config.user, config.password))
  }
  catch (err) {
    console.error('[imap] connection failed:', err)
    throw new Error('IMAP connection failed')
  }

  try {
    // Must run sequentially — a single IMAP connection can only have one mailbox open at a time
    const inbox = await fetchFromFolder(connection, 'INBOX', emailAddress, 'in')
    const sent = await fetchFromFolder(connection, 'Sent', emailAddress, 'out')
    return [...inbox, ...sent]
  }
  finally {
    try { connection.end() } catch { /* ignore */ }
  }
}
