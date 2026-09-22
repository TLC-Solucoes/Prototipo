import type { NextRequest } from 'next/server'
import { ABERTURA } from '@/lib/abertura'
import {
  appendMessage,
  appendUserMessageWithinLimit,
  countRecentConversations,
  countUserMessages,
  createConversationWithinLimit,
  getConversation,
  listMessages,
} from '@/lib/db'
import { hashIp } from '@/lib/hash'
import { streamChat } from '@/lib/llm'
import { buildChatMessages } from '@/lib/prompt'
import {
  checkMessage,
  checkNewConversation,
  LIMITS,
  RECUSA_IP,
  RECUSA_MENSAGENS,
} from '@/lib/rate-limit'
import {
  clientIp,
  conversationCookieHeader,
  readConversationId,
} from '@/lib/session'

export const runtime = 'nodejs'

const FALHA_DO_MODELO =
  'Não consegui responder agora. Sua mensagem foi guardada — tenta de novo em instantes.'

const deps = { countRecentConversations, countUserMessages }

function texto(corpo: string, cookie: string | null): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (cookie) headers['Set-Cookie'] = cookie
  return new Response(corpo, { headers })
}

export async function POST(req: NextRequest): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as { text?: string } | null
  if (!corpo || typeof corpo.text !== 'string') {
    return texto('Não entendi sua mensagem.', null)
  }

  const mensagem = corpo.text.trim()
  const ipHash = hashIp(clientIp(req))
  let conversationId: string | null = null
  let cookie: string | null = null
  let historico: Awaited<ReturnType<typeof listMessages>>

  try {
    conversationId = readConversationId(req)
    if (conversationId && !(await getConversation(conversationId))) {
      conversationId = null
    }

    if (!conversationId) {
      const veredito = await checkNewConversation(deps, ipHash)
      if (!veredito.ok) return texto(veredito.message, null)

      conversationId = await createConversationWithinLimit(
        ipHash,
        LIMITS.newConversationsPerHour,
      )
      if (!conversationId) return texto(RECUSA_IP, null)

      cookie = conversationCookieHeader(conversationId)
      await appendMessage(conversationId, 'assistant', ABERTURA)
    }

    const veredito = await checkMessage(deps, conversationId, mensagem)
    if (!veredito.ok) return texto(veredito.message, cookie)

    const gravou = await appendUserMessageWithinLimit(
      conversationId,
      mensagem,
      LIMITS.userMessagesPerConversation,
    )
    if (!gravou) return texto(RECUSA_MENSAGENS, cookie)

    historico = await listMessages(conversationId)
  } catch {
    return texto(FALHA_DO_MODELO, cookie)
  }

  const id = conversationId
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let completo = ''
      let incompleta = false
      try {
        for await (const pedaco of streamChat(buildChatMessages(historico))) {
          completo += pedaco
          controller.enqueue(encoder.encode(pedaco))
        }
      } catch {
        incompleta = true
        if (completo === '') controller.enqueue(encoder.encode(FALHA_DO_MODELO))
      } finally {
        try {
          if (completo !== '') await appendMessage(id, 'assistant', completo, incompleta)
        } catch {
          incompleta = true
        }
        controller.close()
      }
    },
  })

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (cookie) headers['Set-Cookie'] = cookie

  return new Response(stream, { headers })
}
