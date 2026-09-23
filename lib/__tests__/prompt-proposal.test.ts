import { describe, expect, it } from 'vitest'
import { stripCodeFence } from '@/lib/prompt-proposal'

describe('stripCodeFence', () => {
  it('devolve texto sem cerca intacto', () => {
    expect(stripCodeFence('Você é consultor da TLC.')).toBe('Você é consultor da TLC.')
  })

  it('tira a cerca sem linguagem', () => {
    expect(stripCodeFence('```\nVocê é consultor\nda TLC.\n```')).toBe(
      'Você é consultor\nda TLC.',
    )
  })

  it('tira a cerca com linguagem anotada', () => {
    expect(stripCodeFence('```markdown\nVocê é consultor.\n```')).toBe(
      'Você é consultor.',
    )
  })

  it('tira a cerca cercada de espaço em branco', () => {
    expect(stripCodeFence('\n\n```text\nregra\n```\n\n')).toBe('regra')
  })

  it('aguenta cerca que abre e não fecha', () => {
    expect(stripCodeFence('```\nregra que ficou aberta')).toBe(
      'regra que ficou aberta',
    )
  })

  it('não confunde cerca no meio do texto com embrulho', () => {
    expect(stripCodeFence('use ``` para citar código')).toBe(
      'use ``` para citar código',
    )
  })
})
