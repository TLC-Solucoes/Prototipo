import { carregarSystemPrompt } from '@/lib/prompt'
import { proposePrompt } from '@/lib/prompt-proposal'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as { pedido?: string } | null
  const pedido = corpo?.pedido?.trim()
  if (!pedido) return new Response('pedido ausente', { status: 400 })

  const atual = await carregarSystemPrompt()
  const proposta = await proposePrompt(atual, pedido)
  if (proposta === '') return Response.json({ proposta: null })

  return Response.json({ proposta })
}
