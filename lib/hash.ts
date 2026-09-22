import { createHash } from 'node:crypto'
import type { Message } from '@/lib/types'

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida`)
  return valor
}

export function hashIp(ip: string): string {
  const salt = obrigatoria('IP_HASH_SALT')
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export function hashTranscript(
  messages: Pick<Message, 'role' | 'content'>[],
): string {
  const joined = messages.map((m) => `${m.role}\n${m.content}`).join('\n---\n')
  return createHash('sha256').update(joined).digest('hex')
}
