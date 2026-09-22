import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  delete process.env.MODEL_NAME_EXTRACT
})

describe('extractModel', () => {
  it('usa MODEL_NAME_EXTRACT quando definida', async () => {
    process.env.OPENAI_BASE_URL = 'https://vps.exemplo/v1'
    process.env.OPENAI_API_KEY = 'chave'
    process.env.MODEL_NAME = 'modelo-conversa'
    process.env.MODEL_NAME_EXTRACT = 'modelo-extracao'
    const { extractModel } = await import('@/lib/llm')
    expect(extractModel()).toBe('modelo-extracao')
  })

  it('cai para MODEL_NAME quando MODEL_NAME_EXTRACT falta', async () => {
    process.env.OPENAI_BASE_URL = 'https://vps.exemplo/v1'
    process.env.OPENAI_API_KEY = 'chave'
    process.env.MODEL_NAME = 'modelo-conversa'
    const { extractModel } = await import('@/lib/llm')
    expect(extractModel()).toBe('modelo-conversa')
  })
})
