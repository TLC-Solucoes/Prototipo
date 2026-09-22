import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { complete, streamChat } from '@/lib/llm'

const URL_AGENTE = 'https://agente.exemplo/api/agents/abc/chat/stream'

function sse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
  return new Response(body, {
    status: 201,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function frame(content: string | null): string {
  const delta = content === null ? { role: 'assistant', content: null } : { content }
  return `data: ${JSON.stringify({
    choices: [{ finish_reason: null, index: 0, delta }],
    object: 'chat.completion.chunk',
  })}\n\n`
}

async function juntar(gerador: AsyncGenerator<string>): Promise<string[]> {
  const partes: string[] = []
  for await (const p of gerador) partes.push(p)
  return partes
}

function mockFetch(resposta: Response) {
  const fetchMock = vi.fn(async () => resposta)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  process.env.AGENT_CHAT_URL = URL_AGENTE
  process.env.AGENT_API_KEY = 'chave-secreta'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.AGENT_CHAT_URL
  delete process.env.AGENT_API_KEY
})

describe('streamChat', () => {
  it('manda a última mensagem em message e as anteriores em history', async () => {
    const fetchMock = mockFetch(sse([frame(null), frame('oi'), 'data: [DONE]\n\n']))

    await juntar(
      streamChat([
        { role: 'system', content: 'Seja breve.' },
        { role: 'assistant', content: 'Olá!' },
        { role: 'user', content: 'Tenho uma clínica.' },
      ]),
    )

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(URL_AGENTE)
    expect(JSON.parse(init.body as string)).toEqual({
      message: 'Tenho uma clínica.',
      history: [
        { role: 'system', content: 'Seja breve.' },
        { role: 'assistant', content: 'Olá!' },
      ],
    })
  })

  it('autentica com x-api-key e não manda Authorization', async () => {
    const fetchMock = mockFetch(sse(['data: [DONE]\n\n']))

    await juntar(streamChat([{ role: 'user', content: 'oi' }]))

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('chave-secreta')
    expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain(
      'authorization',
    )
  })

  it('devolve o texto dos deltas na ordem', async () => {
    mockFetch(
      sse([
        frame(null),
        frame('Olá'),
        frame(', tudo'),
        frame(' bem?'),
        'data: [DONE]\n\n',
      ]),
    )

    const partes = await juntar(streamChat([{ role: 'user', content: 'oi' }]))
    expect(partes.join('')).toBe('Olá, tudo bem?')
  })

  it('remonta um frame partido entre dois chunks de rede', async () => {
    const inteiro = frame('automação')
    const corte = Math.floor(inteiro.length / 2)
    mockFetch(
      sse([inteiro.slice(0, corte), inteiro.slice(corte), 'data: [DONE]\n\n']),
    )

    const partes = await juntar(streamChat([{ role: 'user', content: 'oi' }]))
    expect(partes.join('')).toBe('automação')
  })

  it('remonta acento partido entre dois chunks de rede', async () => {
    const bytes = new TextEncoder().encode(frame('ação'))
    const meio = bytes.indexOf(0xc3, 20)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, meio + 1))
        controller.enqueue(bytes.slice(meio + 1))
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    mockFetch(new Response(body, { status: 201 }))

    const partes = await juntar(streamChat([{ role: 'user', content: 'oi' }]))
    expect(partes.join('')).toBe('ação')
  })

  it('pula uma linha data: malformada e segue o stream', async () => {
    mockFetch(
      sse([
        frame('antes'),
        'data: {isso não é json}\n\n',
        frame(' depois'),
        'data: [DONE]\n\n',
      ]),
    )

    const partes = await juntar(streamChat([{ role: 'user', content: 'oi' }]))
    expect(partes.join('')).toBe('antes depois')
  })

  it('para no [DONE] e ignora o que vier depois', async () => {
    mockFetch(sse([frame('fim'), 'data: [DONE]\n\n', frame(' extra')]))

    const partes = await juntar(streamChat([{ role: 'user', content: 'oi' }]))
    expect(partes.join('')).toBe('fim')
  })

  it('reclama nomeando AGENT_CHAT_URL quando ela falta', async () => {
    delete process.env.AGENT_CHAT_URL
    mockFetch(sse(['data: [DONE]\n\n']))

    await expect(juntar(streamChat([{ role: 'user', content: 'oi' }]))).rejects.toThrow(
      /AGENT_CHAT_URL/,
    )
  })

  it('reclama nomeando AGENT_API_KEY quando ela falta', async () => {
    delete process.env.AGENT_API_KEY
    mockFetch(sse(['data: [DONE]\n\n']))

    await expect(juntar(streamChat([{ role: 'user', content: 'oi' }]))).rejects.toThrow(
      /AGENT_API_KEY/,
    )
  })

  it('recusa uma última mensagem vazia sem chamar o agente', async () => {
    const fetchMock = mockFetch(sse(['data: [DONE]\n\n']))

    await expect(
      juntar(streamChat([{ role: 'user', content: '   ' }])),
    ).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('erra com o status quando a resposta não é ok, em vez de stream vazio', async () => {
    mockFetch(
      new Response('{"message":"message must be a string"}', { status: 400 }),
    )

    await expect(juntar(streamChat([{ role: 'user', content: 'oi' }]))).rejects.toThrow(
      /400/,
    )
  })
})

describe('complete', () => {
  it('junta o stream inteiro numa string', async () => {
    mockFetch(
      sse([frame('{"dor"'), frame(':"planilha"}'), 'data: [DONE]\n\n']),
    )

    const texto = await complete([
      { role: 'system', content: 'Extraia JSON.' },
      { role: 'user', content: 'transcript' },
    ])
    expect(texto).toBe('{"dor":"planilha"}')
  })
})
