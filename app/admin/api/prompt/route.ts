import { insertPromptVersion } from '@/lib/db'
import type { PromptOrigem } from '@/lib/types'

export const runtime = 'nodejs'

const ORIGENS: PromptOrigem[] = ['manual', 'ia']

export async function POST(req: Request): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as {
    conteudo?: string
    origem?: string
    pedido?: string
  } | null

  const conteudo = corpo?.conteudo?.trim()
  if (!conteudo) return new Response('conteúdo ausente', { status: 400 })

  const origem = corpo?.origem as PromptOrigem | undefined
  if (!origem || !ORIGENS.includes(origem)) {
    return new Response('origem inválida', { status: 400 })
  }

  const pedido = origem === 'ia' ? (corpo?.pedido?.trim() ?? null) : null
  const id = await insertPromptVersion(conteudo, origem, pedido)
  return Response.json({ id })
}
