import { describe, expect, it } from 'vitest'
import {
  chatPausado,
  checkMessage,
  checkNewConversation,
  checkTextSize,
  CONVERSAS_POR_HORA_PADRAO,
  LIMITS,
  maxConversasHora,
  type RateLimitDeps,
} from '@/lib/rate-limit'

function deps(conversas: number, mensagens: number): RateLimitDeps {
  return {
    countRecentConversations: async () => conversas,
    countUserMessages: async () => mensagens,
  }
}

describe('checkNewConversation', () => {
  it('libera abaixo do teto', async () => {
    const v = await checkNewConversation(deps(LIMITS.newConversationsPerHour - 1, 0), 'h')
    expect(v.ok).toBe(true)
  })

  it('bloqueia no teto', async () => {
    const v = await checkNewConversation(deps(LIMITS.newConversationsPerHour, 0), 'h')
    expect(v.ok).toBe(false)
  })

  it('identifica o motivo como ip', async () => {
    const v = await checkNewConversation(deps(99, 0), 'h')
    expect(v.ok === false && v.reason).toBe('ip')
  })

  it('devolve mensagem pronta para o visitante ler', async () => {
    const v = await checkNewConversation(deps(99, 0), 'h')
    expect(v.ok === false && v.message.length).toBeGreaterThan(20)
  })
})

describe('checkMessage', () => {
  it('libera abaixo dos tetos', async () => {
    const v = await checkMessage(deps(0, 3), 'c', 'tenho uma loja')
    expect(v.ok).toBe(true)
  })

  it('bloqueia no teto de mensagens', async () => {
    const v = await checkMessage(
      deps(0, LIMITS.userMessagesPerConversation),
      'c',
      'oi',
    )
    expect(v.ok === false && v.reason).toBe('mensagens')
  })

  it('bloqueia mensagem longa demais', async () => {
    const v = await checkMessage(deps(0, 0), 'c', 'a'.repeat(LIMITS.maxChars + 1))
    expect(v.ok === false && v.reason).toBe('tamanho')
  })

  it('aceita mensagem exatamente no tamanho máximo', async () => {
    const v = await checkMessage(deps(0, 0), 'c', 'a'.repeat(LIMITS.maxChars))
    expect(v.ok).toBe(true)
  })

  it('rejeita mensagem vazia', async () => {
    const v = await checkMessage(deps(0, 0), 'c', '   ')
    expect(v.ok === false && v.reason).toBe('tamanho')
  })
})

describe('checkTextSize', () => {
  it('não precisa de conversa para recusar mensagem vazia', () => {
    const v = checkTextSize('   ')
    expect(v.ok === false && v.reason).toBe('tamanho')
  })

  it('não precisa de conversa para recusar mensagem longa demais', () => {
    const v = checkTextSize('a'.repeat(LIMITS.maxChars + 1))
    expect(v.ok === false && v.reason).toBe('tamanho')
  })

  it('libera mensagem exatamente no tamanho máximo', () => {
    expect(checkTextSize('a'.repeat(LIMITS.maxChars)).ok).toBe(true)
  })

  it('devolve a mesma recusa que checkMessage', async () => {
    const pelaMensagem = await checkMessage(deps(0, 0), 'c', '')
    const peloTamanho = checkTextSize('')
    expect(peloTamanho.ok === false && peloTamanho.message).toBe(
      pelaMensagem.ok === false && pelaMensagem.message,
    )
  })
})

describe('maxConversasHora', () => {
  it('cai no padrão sem a variável', () => {
    delete process.env.MAX_CONVERSAS_HORA
    expect(maxConversasHora()).toBe(CONVERSAS_POR_HORA_PADRAO)
  })

  it('obedece a variável', () => {
    process.env.MAX_CONVERSAS_HORA = '12'
    try {
      expect(maxConversasHora()).toBe(12)
    } finally {
      delete process.env.MAX_CONVERSAS_HORA
    }
  })

  it('ignora lixo na variável', () => {
    process.env.MAX_CONVERSAS_HORA = 'muitas'
    try {
      expect(maxConversasHora()).toBe(CONVERSAS_POR_HORA_PADRAO)
    } finally {
      delete process.env.MAX_CONVERSAS_HORA
    }
  })
})

describe('chatPausado', () => {
  const casos: [string | undefined, boolean][] = [
    [undefined, false],
    ['', false],
    ['0', false],
    ['false', false],
    ['FALSE', false],
    ['off', false],
    [' off ', false],
    ['1', true],
    ['true', true],
    ['sim', true],
  ]

  for (const [valor, esperado] of casos) {
    it(`${valor === undefined ? 'sem a variável' : `com "${valor}"`} responde ${esperado}`, () => {
      if (valor === undefined) delete process.env.CHAT_PAUSADO
      else process.env.CHAT_PAUSADO = valor
      try {
        expect(chatPausado()).toBe(esperado)
      } finally {
        delete process.env.CHAT_PAUSADO
      }
    })
  }
})
