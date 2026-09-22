import { beforeEach, describe, expect, it, vi } from 'vitest'

const appendMessage = vi.fn()
const streamChat = vi.fn()

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
  streamChat: (...args: unknown[]) => streamChat(...args),
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
  appendMessage.mockReset()
  streamChat.mockReset()
  streamChat.mockImplementation(async function* () {
    throw new Error('vps fora do ar')
  })
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

  it('grava o parcial e marca como incompleta quando o stream corta no meio', async () => {
    streamChat.mockImplementation(async function* () {
      yield 'Duas horas por dia é '
      yield 'meio expediente por semana'
      throw new Error('vps caiu no meio')
    })
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('umas 2 horas por dia'))
    expect(await resposta.text()).toBe('Duas horas por dia é meio expediente por semana')

    const gravacao = appendMessage.mock.calls.find((c) => c[1] === 'assistant')
    expect(gravacao?.[2]).toBe('Duas horas por dia é meio expediente por semana')
    expect(gravacao?.[3]).toBe(true)
  })

  it('responde em português quando o banco falha antes do stream', async () => {
    appendMessage.mockRejectedValueOnce(new Error('banco fora do ar'))
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    expect(await resposta.text()).toContain('tenta de novo')
  })
})
