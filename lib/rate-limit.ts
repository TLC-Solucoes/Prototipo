export const LIMITS = {
  newConversationsPerHour: 5,
  userMessagesPerConversation: 40,
  maxChars: 2000,
}

export const RECUSA_IP =
  'Você já abriu várias conversas por aqui hoje. Se quiser falar com a gente agora, é melhor chamar direto no contato da TLC.'

export const RECUSA_MENSAGENS =
  'A gente já conversou bastante e eu tenho material de sobra pro time trabalhar. Me deixa seu nome e um contato que alguém te procura.'

export const CONVERSAS_POR_HORA_PADRAO = 60

export const PAUSADO =
  'O assistente está fora do ar por alguns instantes. Volta daqui a pouco que a gente mapeia o que dá pra automatizar no seu negócio.'

export const RECUSA_GLOBAL =
  'Estou atendendo muita gente agora e não consigo te ouvir direito. Tenta de novo mais tarde, ou fala com a TLC pelo contato direto.'

const NEGATIVOS = ['', '0', 'false', 'off']

export function chatPausado(): boolean {
  const bruto = (process.env.CHAT_PAUSADO ?? '').trim().toLowerCase()
  return !NEGATIVOS.includes(bruto)
}

export function maxConversasHora(): number {
  const bruto = Number(process.env.MAX_CONVERSAS_HORA)
  return Number.isFinite(bruto) && bruto > 0 ? bruto : CONVERSAS_POR_HORA_PADRAO
}

export type RateLimitDeps = {
  countRecentConversations: (ipHash: string, minutes: number) => Promise<number>
  countUserMessages: (conversationId: string) => Promise<number>
}

export type Verdict =
  | { ok: true }
  | { ok: false; reason: 'ip' | 'mensagens' | 'tamanho'; message: string }

export async function checkNewConversation(
  deps: RateLimitDeps,
  ipHash: string,
): Promise<Verdict> {
  const recentes = await deps.countRecentConversations(ipHash, 60)
  if (recentes >= LIMITS.newConversationsPerHour) {
    return {
      ok: false,
      reason: 'ip',
      message: RECUSA_IP,
    }
  }
  return { ok: true }
}

export function checkTextSize(text: string): Verdict {
  const limpo = text.trim()
  if (limpo.length === 0 || limpo.length > LIMITS.maxChars) {
    return {
      ok: false,
      reason: 'tamanho',
      message: `Manda em até ${LIMITS.maxChars} caracteres que eu consigo te acompanhar melhor.`,
    }
  }
  return { ok: true }
}

export async function checkMessage(
  deps: RateLimitDeps,
  conversationId: string,
  text: string,
): Promise<Verdict> {
  const tamanho = checkTextSize(text)
  if (!tamanho.ok) return tamanho

  const enviadas = await deps.countUserMessages(conversationId)
  if (enviadas >= LIMITS.userMessagesPerConversation) {
    return {
      ok: false,
      reason: 'mensagens',
      message: RECUSA_MENSAGENS,
    }
  }

  return { ok: true }
}
