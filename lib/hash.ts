import { createHash } from 'node:crypto'
import type { Message } from '@/lib/types'

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? ''
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export function hashTranscript(
  messages: Pick<Message, 'role' | 'content'>[],
): string {
  const joined = messages.map((m) => `${m.role}\n${m.content}`).join('\n---\n')
  return createHash('sha256').update(joined).digest('hex')
}
