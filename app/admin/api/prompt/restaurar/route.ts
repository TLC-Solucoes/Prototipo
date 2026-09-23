import { restorePromptVersion } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as { id?: number } | null
  if (typeof corpo?.id !== 'number') return new Response('id ausente', { status: 400 })

  const restaurou = await restorePromptVersion(corpo.id)
  return Response.json({ restaurou })
}
