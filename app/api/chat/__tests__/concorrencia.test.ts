import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LIMITS } from '@/lib/rate-limit'

const conversas: string[] = []
const mensagensDoUsuario: string[] = []

async function latencia() {
  await new Promise((resolve) => setTimeout(resolve, 1))
}

vi.mock('@/lib/db', () => ({
  appendMessage: async () => {},
  appendUserMessageWithinLimit: async (
    _id: string,
    content: string,
    maxMessages: number,
  ) => {
    await latencia()
    if (mensagensDoUsuario.length >= maxMessages) return false
    mensagensDoUsuario.push(content)
    return true
  },
  countConversationsLastHour: async () => {
    await latencia()
    return conversas.length
  },
  countRecentConversations: async () => {
    await latencia()
    return conversas.length
  },
  countUserMessages: async () => {
    await latencia()
    return mensagensDoUsuario.length
  },
  createConversationWithinLimit: async (_ipHash: string, perHour: number) => {
    await latencia()
    if (conversas.length >= perHour) return null
    const id = `conversa-${conversas.length + 1}`
    conversas.push(id)
    return id
  },
  getConversation: async (id: string) => (id ? { id } : null),
  listMessages: async () => [
    { id: 1, role: 'user', content: 'oi', incomplete: false, createdAt: new Date() },
  ],
}))

vi.mock('@/lib/llm', () => ({
  streamChat: async function* () {
    yield 'resposta'
  },
}))

function requisicao(cookie: string | null) {
  return {
    json: async () => ({ text: 'tenho uma loja' }),
    headers: new Headers({ 'x-forwarded-for': '200.1.2.3' }),
    cookies: { get: () => (cookie ? { value: cookie } : undefined) },
  } as never
}

beforeEach(() => {
  process.env.IP_HASH_SALT = 'salt-de-teste'
  conversas.length = 0
  mensagensDoUsuario.length = 0
})

describe('POST /api/chat com requisições simultâneas', () => {
  it('não cria mais conversas que o teto por IP', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const disparos = Array.from({ length: 20 }, () => POST(requisicao(null)))
    const respostas = await Promise.all(disparos)
    await Promise.all(respostas.map((r) => r.text()))

    expect(conversas).toHaveLength(LIMITS.newConversationsPerHour)
  })

  it('recusa em português o que passou do teto por IP', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const respostas = await Promise.all(
      Array.from({ length: 20 }, () => POST(requisicao(null))),
    )
    const corpos = await Promise.all(respostas.map((r) => r.text()))
    const recusas = corpos.filter((c) => c.includes('conversas por aqui'))

    expect(recusas).toHaveLength(20 - LIMITS.newConversationsPerHour)
  })

  it('não grava mais mensagens que o teto por conversa', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const disparos = Array.from({ length: LIMITS.userMessagesPerConversation + 15 }, () =>
      POST(requisicao('conversa-1')),
    )
    const respostas = await Promise.all(disparos)
    await Promise.all(respostas.map((r) => r.text()))

    expect(mensagensDoUsuario).toHaveLength(LIMITS.userMessagesPerConversation)
  })
})
