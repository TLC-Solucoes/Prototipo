import { summarizeConversation } from '@/lib/summarize'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as { id?: string } | null
  if (!corpo?.id) return new Response('id ausente', { status: 400 })

  const gerou = await summarizeConversation(corpo.id, true)
  return Response.json({ gerou })
}
