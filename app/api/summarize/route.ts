import type { NextRequest } from 'next/server'
import { summarizeConversation } from '@/lib/summarize'
import { readConversationId } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<Response> {
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
