import { claimSummarySlot, getConversation, listMessages, saveSummary } from '@/lib/db'
import { hashTranscript } from '@/lib/hash'
import { complete } from '@/lib/llm'
import { parseSummary, SUMMARY_INSTRUCTION } from '@/lib/summary'
import { COOLDOWN_MS, shouldSummarize } from '@/lib/summarize-guard'

export async function summarizeConversation(
  conversationId: string,
  force: boolean,
): Promise<boolean> {
  const conversa = await getConversation(conversationId)
  if (!conversa) return false

  const lidoEm = new Date()
  const mensagens = await listMessages(conversationId)
  if (mensagens.length < 2) return false

  const transcriptHash = hashTranscript(mensagens)
  const permitido = shouldSummarize({
    summaryAttemptedAt: conversa.summaryAttemptedAt,
    summaryInputHash: conversa.summaryInputHash,
    transcriptHash,
    now: new Date(),
    force,
  })
  if (!permitido) return false

  if (!force) {
    const vaga = await claimSummarySlot(conversationId, COOLDOWN_MS / 1000)
    if (!vaga) return false
  }

  const transcript = mensagens
    .map((m) => `${m.role === 'user' ? 'Visitante' : 'Consultor'}: ${m.content}`)
    .join('\n')

  const bruto = await complete([
    { role: 'system', content: SUMMARY_INSTRUCTION },
    { role: 'user', content: transcript },
  ])

  const resumo = parseSummary(bruto)
  if (!resumo) {
    console.error('summarize: o modelo não devolveu JSON utilizável')
    return false
  }

  await saveSummary(conversationId, resumo, transcriptHash, lidoEm)
  return true
}
