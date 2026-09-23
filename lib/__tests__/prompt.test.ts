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

  it('carrega os pontos do roteiro', () => {
    const pontos = [
      'O nome dela',
      'Que negócio é o dela',
      'Por onde o cliente dela chega',
      'Onde o atendimento trava',
      'Quanto isso custa',
      'Um contato usável dela',
    ]
    for (const ponto of pontos) {
      expect(prompt).toContain(ponto)
    }
  })

  it('manda perguntar o nome antes de qualquer outra pergunta', () => {
    expect(prompt).toContain('antes de qualquer outra pergunta')
  })

  it('exige contato usável, não uma promessa de contato', () => {
    expect(prompt).toContain('"Me chama no WhatsApp" não é um contato')
    expect(prompt).toContain('"Manda um e-mail" não é um contato')
  })

  it('foca a conversa em atendimento ao cliente', () => {
    expect(prompt).toContain('A TLC resolve atendimento ao cliente')
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
