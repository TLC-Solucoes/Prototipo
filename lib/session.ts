import type { NextRequest } from 'next/server'

export const CONVERSATION_COOKIE = 'tlc_conversa'

const DURACAO_DA_VISITA = 60 * 60 * 2

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readConversationId(req: NextRequest): string | null {
  const valor = req.cookies.get(CONVERSATION_COOKIE)?.value
  if (!valor || !UUID.test(valor)) return null
  return valor
}

export function conversationCookieHeader(id: string): string {
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${CONVERSATION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURACAO_DA_VISITA}${seguro}`
}

export function clientIp(req: NextRequest): string {
  const encaminhado = req.headers.get('x-forwarded-for')
  const primeiro = encaminhado?.split(',')[0]?.trim()
  return primeiro || 'desconhecido'
}
