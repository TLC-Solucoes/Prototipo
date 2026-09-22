import { beforeEach, describe, expect, it, vi } from 'vitest'

const appendMessage = vi.fn()

vi.mock('@/lib/db', () => ({
  appendMessage: (...args: unknown[]) => appendMessage(...args),
  countRecentConversations: async () => 0,
  countUserMessages: async () => 0,
  createConversation: async () => 'conversa-1',
  getConversation: async () => null,
  listMessages: async () => [
    {
      id: 1,
      role: 'user',
      content: 'tenho uma loja',
      incomplete: false,
      createdAt: new Date(),
    },
  ],
}))

vi.mock('@/lib/llm', () => ({
  streamChat: async function* () {
    throw new Error('vps fora do ar')
  },
}))

function requisicao(text: string) {
  return {
    json: async () => ({ text }),
    headers: new Headers({ 'x-forwarded-for': '200.1.2.3' }),
    cookies: { get: () => undefined },
  } as never
}

beforeEach(() => {
  process.env.IP_HASH_SALT = 'salt-de-teste'
  appendMessage.mockClear()
})

describe('POST /api/chat quando o modelo falha', () => {
  it('grava a mensagem do visitante mesmo assim', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    await resposta.text()
    expect(appendMessage).toHaveBeenCalledWith(
      'conversa-1',
      'user',
      'tenho uma loja',
    )
  })

  it('avisa o visitante em vez de devolver erro cru', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    expect(await resposta.text()).toContain('tenta de novo')
  })

  it('não grava resposta vazia do assistente', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    await resposta.text()
    const gravacoes = appendMessage.mock.calls.filter((c) => c[1] === 'assistant')
    expect(gravacoes).toHaveLength(0)
  })
})
