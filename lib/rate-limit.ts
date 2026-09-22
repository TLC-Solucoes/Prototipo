export const LIMITS = {
  newConversationsPerHour: 5,
  userMessagesPerConversation: 40,
  maxChars: 2000,
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
      message:
        'Você já abriu várias conversas por aqui hoje. Se quiser falar com a gente agora, é melhor chamar direto no contato da TLC.',
    }
  }
  return { ok: true }
}

export async function checkMessage(
  deps: RateLimitDeps,
  conversationId: string,
  text: string,
): Promise<Verdict> {
  const limpo = text.trim()
  if (limpo.length === 0 || limpo.length > LIMITS.maxChars) {
    return {
      ok: false,
      reason: 'tamanho',
      message: `Manda em até ${LIMITS.maxChars} caracteres que eu consigo te acompanhar melhor.`,
    }
  }

  const enviadas = await deps.countUserMessages(conversationId)
  if (enviadas >= LIMITS.userMessagesPerConversation) {
    return {
      ok: false,
      reason: 'mensagens',
      message:
        'A gente já conversou bastante e eu tenho material de sobra pro time trabalhar. Me deixa seu nome e um contato que alguém te procura.',
    }
  }

  return { ok: true }
}
