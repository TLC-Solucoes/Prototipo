import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ABERTURA } from '@/lib/abertura'
import { LIMITS, maxConversasHora } from '@/lib/rate-limit'

const appendMessage = vi.fn()
const appendUserMessageWithinLimit = vi.fn()
const countConversationsLastHour = vi.fn()
const streamChat = vi.fn()
const listMessages = vi.fn()

vi.mock('@/lib/db', () => ({
  appendMessage: (...args: unknown[]) => appendMessage(...args),
  appendUserMessageWithinLimit: (...args: unknown[]) =>
    appendUserMessageWithinLimit(...args),
  countConversationsLastHour: (...args: unknown[]) => countConversationsLastHour(...args),
  countRecentConversations: async () => 0,
  countUserMessages: async () => 0,
  createConversationWithinLimit: async () => 'conversa-1',
  getConversation: async () => null,
  listMessages: (...args: unknown[]) => listMessages(...args),
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
  delete process.env.CHAT_PAUSADO
  appendMessage.mockReset()
  appendUserMessageWithinLimit.mockReset()
  appendUserMessageWithinLimit.mockResolvedValue(true)
  countConversationsLastHour.mockReset()
  countConversationsLastHour.mockResolvedValue(0)
  streamChat.mockReset()
  streamChat.mockImplementation(async function* () {
    throw new Error('vps fora do ar')
  })
  listMessages.mockReset()
  listMessages.mockResolvedValue([
    {
      id: 1,
      role: 'user',
      content: 'tenho uma loja',
      incomplete: false,
      createdAt: new Date(),
    },
  ])
})

describe('POST /api/chat quando o modelo falha', () => {
  it('não toca no banco nem no modelo com o chat pausado', async () => {
    process.env.CHAT_PAUSADO = '1'
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))

    expect(await resposta.text()).toContain('fora do ar')
    expect(appendMessage).not.toHaveBeenCalled()
    expect(appendUserMessageWithinLimit).not.toHaveBeenCalled()
    expect(streamChat).not.toHaveBeenCalled()
  })

  it('recusa conversa nova quando o teto global da hora estourou', async () => {
    countConversationsLastHour.mockResolvedValue(maxConversasHora())
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))

    expect(await resposta.text()).toContain('muita gente')
    expect(appendUserMessageWithinLimit).not.toHaveBeenCalled()
    expect(streamChat).not.toHaveBeenCalled()
  })

  it('não vaza erro cru quando falta o salt do hash de IP', async () => {
    delete process.env.IP_HASH_SALT
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))

    expect(await resposta.text()).toContain('não consegui registrar')
    expect(streamChat).not.toHaveBeenCalled()
  })

  it('grava a mensagem do visitante mesmo assim', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    await resposta.text()
    expect(appendUserMessageWithinLimit).toHaveBeenCalledWith(
      'conversa-1',
      'tenho uma loja',
      LIMITS.userMessagesPerConversation,
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
    const gravacoes = appendMessage.mock.calls.filter(
      (c) => c[1] === 'assistant' && c[2] !== ABERTURA,
    )
    expect(gravacoes).toHaveLength(0)
  })

  it('avisa o visitante quando o stream termina vazio sem erro nenhum', async () => {
    streamChat.mockImplementation(async function* () {})
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    expect(await resposta.text()).toContain('tenta de novo')
  })

  it('não grava nada quando o stream termina vazio', async () => {
    streamChat.mockImplementation(async function* () {})
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    await resposta.text()
    const gravacoes = appendMessage.mock.calls.filter(
      (c) => c[1] === 'assistant' && c[2] !== ABERTURA,
    )
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

    const gravacao = appendMessage.mock.calls.find(
      (c) => c[1] === 'assistant' && c[2] !== ABERTURA,
    )
    expect(gravacao?.[2]).toBe('Duas horas por dia é meio expediente por semana')
    expect(gravacao?.[3]).toBe(true)
  })

  it('responde em português quando o banco falha antes do stream', async () => {
    appendMessage.mockRejectedValueOnce(new Error('banco fora do ar'))
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    expect(await resposta.text()).toContain('não consegui registrar')
  })

  it('não promete ter guardado a mensagem quando foi o banco que falhou', async () => {
    appendMessage.mockRejectedValueOnce(new Error('banco fora do ar'))
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma loja'))
    expect(await resposta.text()).not.toContain('guardada')
  })

  it('o modelo recebe a abertura como contexto já na primeira mensagem do visitante', async () => {
    listMessages.mockResolvedValueOnce([
      {
        id: 1,
        role: 'assistant',
        content: ABERTURA,
        incomplete: false,
        createdAt: new Date(),
      },
      {
        id: 2,
        role: 'user',
        content: 'tenho uma clínica de fisioterapia',
        incomplete: false,
        createdAt: new Date(),
      },
    ])
    const { POST } = await import('@/app/api/chat/route')
    const resposta = await POST(requisicao('tenho uma clínica de fisioterapia'))
    await resposta.text()

    expect(appendMessage).toHaveBeenCalledWith('conversa-1', 'assistant', ABERTURA)

    const mensagens = streamChat.mock.calls[0][0]
    expect(mensagens.map((m: { role: string }) => m.role)).toEqual([
      'system',
      'assistant',
      'user',
    ])
    expect(mensagens[1].content).toBe(ABERTURA)
    expect(mensagens[2].content).toBe('tenho uma clínica de fisioterapia')
  })
})
