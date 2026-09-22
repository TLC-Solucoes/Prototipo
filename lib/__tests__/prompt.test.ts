import { describe, expect, it } from 'vitest'
import { buildChatMessages, buildSystemPrompt } from '@/lib/prompt'

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt()

  it('proíbe falar preço', () => {
    expect(prompt).toContain('preço')
  })

  it('manda fazer uma pergunta por mensagem', () => {
    expect(prompt).toContain('uma pergunta por mensagem')
  })

  it('carrega os cinco estágios do roteiro', () => {
    for (const estagio of ['negócio', 'repete', 'tempo', 'usa hoje', 'contato']) {
      expect(prompt).toContain(estagio)
    }
  })

  it('não cita valor nenhum em reais', () => {
    expect(prompt).not.toMatch(/R\$/)
  })
})

describe('buildChatMessages', () => {
  it('põe o system prompt na frente', () => {
    const messages = buildChatMessages([{ role: 'user', content: 'oi' }])
    expect(messages[0].role).toBe('system')
  })

  it('preserva a ordem do histórico', () => {
    const messages = buildChatMessages([
      { role: 'user', content: 'primeira' },
      { role: 'assistant', content: 'segunda' },
      { role: 'user', content: 'terceira' },
    ])
    expect(messages.slice(1).map((m) => m.content)).toEqual([
      'primeira',
      'segunda',
      'terceira',
    ])
  })

  it('funciona com histórico vazio', () => {
    expect(buildChatMessages([])).toHaveLength(1)
  })
})
