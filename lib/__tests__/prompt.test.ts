import { describe, expect, it } from 'vitest'
import { buildChatMessages, buildSystemPrompt } from '@/lib/prompt'

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt()

  it('proíbe falar preço sem deixar brecha', () => {
    expect(prompt).toContain('Nunca fale preço')
  })

  it('enumera o escopo da proibição de preço', () => {
    expect(prompt).toContain('nenhum valor, nenhuma faixa')
  })

  it('manda fazer uma pergunta por mensagem', () => {
    expect(prompt).toContain('uma pergunta por mensagem')
  })

  it('carrega os cinco estágios do roteiro', () => {
    const estagios = [
      'Que negócio é o dela',
      'Que tarefa se repete toda semana',
      'Quanto tempo por semana isso toma',
      'O que ela usa hoje',
      'O nome dela e o melhor contato',
    ]
    for (const estagio of estagios) {
      expect(prompt).toContain(estagio)
    }
  })

  it('não cita valor em reais, nem símbolo nem por extenso', () => {
    expect(prompt).not.toMatch(/R\$|\breais\b/i)
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
