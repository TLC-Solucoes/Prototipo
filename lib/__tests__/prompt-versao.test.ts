import { beforeEach, describe, expect, it, vi } from 'vitest'
import { carregarSystemPrompt, SYSTEM_PADRAO } from '@/lib/prompt'
import { HARD_RULES, missingHardRules } from '@/lib/regras-prompt'

const latestPromptVersion = vi.fn()

vi.mock('@/lib/db', () => ({
  latestPromptVersion: (...args: unknown[]) => latestPromptVersion(...args),
}))

beforeEach(() => {
  latestPromptVersion.mockReset()
})

describe('carregarSystemPrompt', () => {
  it('cai no prompt do código quando não há versão guardada', async () => {
    latestPromptVersion.mockResolvedValue(null)
    expect(await carregarSystemPrompt()).toBe(SYSTEM_PADRAO)
  })

  it('devolve a versão mais nova quando existe', async () => {
    latestPromptVersion.mockResolvedValue('prompt do banco')
    expect(await carregarSystemPrompt()).toBe('prompt do banco')
  })
})

describe('missingHardRules', () => {
  it('aprova o prompt padrão, que tem as três regras', () => {
    expect(missingHardRules(SYSTEM_PADRAO)).toEqual([])
  })

  it('aprova um prompt curto que carrega as três regras', () => {
    expect(missingHardRules(HARD_RULES.join(' · '))).toEqual([])
  })

  for (const regra of HARD_RULES) {
    it(`acusa a falta de "${regra}"`, () => {
      const mutilado = SYSTEM_PADRAO.replace(regra, 'outra coisa')
      expect(missingHardRules(mutilado)).toEqual([regra])
    })
  }

  it('acusa todas de uma vez quando o prompt não tem nenhuma', () => {
    expect(missingHardRules('seja legal com o visitante')).toEqual([...HARD_RULES])
  })
})
