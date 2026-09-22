import { describe, expect, it } from 'vitest'
import { COOLDOWN_MS, shouldSummarize } from '@/lib/summarize-guard'

const agora = new Date('2026-09-21T12:00:00Z')
const haPouco = new Date(agora.getTime() - 10_000)
const haMuito = new Date(agora.getTime() - COOLDOWN_MS - 1_000)

describe('shouldSummarize', () => {
  it('resume conversa que nunca foi resumida', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: null,
        summaryInputHash: null,
        transcriptHash: 'abc',
        now: agora,
      }),
    ).toBe(true)
  })

  it('recusa dentro do cooldown', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: haPouco,
        summaryInputHash: 'antigo',
        transcriptHash: 'novo',
        now: agora,
      }),
    ).toBe(false)
  })

  it('recusa quando o transcript não mudou', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: haMuito,
        summaryInputHash: 'igual',
        transcriptHash: 'igual',
        now: agora,
      }),
    ).toBe(false)
  })

  it('resume fora do cooldown com transcript novo', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: haMuito,
        summaryInputHash: 'antigo',
        transcriptHash: 'novo',
        now: agora,
      }),
    ).toBe(true)
  })

  it('force ignora o cooldown', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: haPouco,
        summaryInputHash: 'antigo',
        transcriptHash: 'novo',
        now: agora,
        force: true,
      }),
    ).toBe(true)
  })

  it('force não regera resumo idêntico', () => {
    expect(
      shouldSummarize({
        summaryAttemptedAt: haPouco,
        summaryInputHash: 'igual',
        transcriptHash: 'igual',
        now: agora,
        force: true,
      }),
    ).toBe(false)
  })
})
