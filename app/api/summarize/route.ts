import type { NextRequest } from 'next/server'
import { chatPausado, PAUSADO } from '@/lib/rate-limit'
import { readConversationId } from '@/lib/session'
import { summarizeConversation } from '@/lib/summarize'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<Response> {
  if (chatPausado()) {
    return new Response(PAUSADO, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const conversationId = readConversationId(req)
  if (!conversationId) return new Response(null, { status: 204 })

  try {
    await summarizeConversation(conversationId, false)
  } catch (erro) {
    console.error('summarize: falha ao resumir a conversa', erro)
    return new Response(null, { status: 204 })
  }

  return new Response(null, { status: 204 })
}
