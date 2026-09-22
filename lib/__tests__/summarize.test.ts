import { beforeEach, describe, expect, it, vi } from 'vitest'

const getConversation = vi.fn()
const listMessages = vi.fn()
const saveSummary = vi.fn()
const claimSummarySlot = vi.fn()
const complete = vi.fn()

vi.mock('@/lib/db', () => ({
  getConversation: (...args: unknown[]) => getConversation(...args),
  listMessages: (...args: unknown[]) => listMessages(...args),
  saveSummary: (...args: unknown[]) => saveSummary(...args),
  claimSummarySlot: (...args: unknown[]) => claimSummarySlot(...args),
}))

vi.mock('@/lib/llm', () => ({
  complete: (...args: unknown[]) => complete(...args),
}))

const RESUMO_JSON = JSON.stringify({
  segmento: 'clínica',
  dorPrincipal: 'remarcar consulta na mão',
  contato: { nome: null, email: null, telefone: null },
})

beforeEach(() => {
  getConversation.mockReset()
  getConversation.mockResolvedValue({
    id: 'c1',
    summaryUpdatedAt: null,
    summaryInputHash: null,
  })
  listMessages.mockReset()
  listMessages.mockResolvedValue([
    { id: 1, role: 'assistant', content: 'oi', incomplete: false, createdAt: new Date() },
    { id: 2, role: 'user', content: 'tenho uma clínica', incomplete: false, createdAt: new Date() },
  ])
  saveSummary.mockReset()
  claimSummarySlot.mockReset()
  claimSummarySlot.mockResolvedValue(true)
  complete.mockReset()
  complete.mockResolvedValue(RESUMO_JSON)
})

describe('summarizeConversation', () => {
  it('reserva a vaga antes de chamar o modelo', async () => {
    const { summarizeConversation } = await import('@/lib/summarize')
    await summarizeConversation('c1', false)
    expect(claimSummarySlot).toHaveBeenCalled()
    expect(claimSummarySlot.mock.invocationCallOrder[0]).toBeLessThan(
      complete.mock.invocationCallOrder[0],
    )
  })

  it('não chama o modelo quando a vaga já foi tomada', async () => {
    claimSummarySlot.mockResolvedValue(false)
    const { summarizeConversation } = await import('@/lib/summarize')
    expect(await summarizeConversation('c1', false)).toBe(false)
    expect(complete).not.toHaveBeenCalled()
  })

  it('gasta a vaga mesmo quando a resposta do modelo não parseia', async () => {
    complete.mockResolvedValue('Respondi em prosa, sem JSON nenhum.')
    const { summarizeConversation } = await import('@/lib/summarize')
    expect(await summarizeConversation('c1', false)).toBe(false)
    expect(claimSummarySlot).toHaveBeenCalledTimes(1)
    expect(saveSummary).not.toHaveBeenCalled()
  })

  it('usa o cooldown de 60 s em segundos', async () => {
    const { summarizeConversation } = await import('@/lib/summarize')
    await summarizeConversation('c1', false)
    expect(claimSummarySlot).toHaveBeenCalledWith('c1', 60)
  })

  it('o painel ignora o cooldown', async () => {
    const { summarizeConversation } = await import('@/lib/summarize')
    await summarizeConversation('c1', true)
    expect(claimSummarySlot).not.toHaveBeenCalled()
    expect(complete).toHaveBeenCalled()
  })

  it('nem o painel re-resume um transcript inalterado', async () => {
    const { hashTranscript } = await import('@/lib/hash')
    const mensagens = await listMessages()
    getConversation.mockResolvedValue({
      id: 'c1',
      summaryUpdatedAt: new Date(),
      summaryInputHash: hashTranscript(mensagens),
    })
    const { summarizeConversation } = await import('@/lib/summarize')
    expect(await summarizeConversation('c1', true)).toBe(false)
    expect(complete).not.toHaveBeenCalled()
  })
})
