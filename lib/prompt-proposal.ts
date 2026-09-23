import { complete } from '@/lib/llm'

export const PROPOSAL_INSTRUCTION = `Você reescreve o prompt de sistema de um chatbot. Receberá o prompt atual e um pedido de mudança.

Devolva o prompt inteiro já reescrito, e absolutamente mais nada: sem preâmbulo, sem explicação, sem comentário no fim, sem cerca de código, sem aspas em volta.

Mude só o que o pedido pede. Todo o resto — cada regra, cada seção, cada exemplo — volta idêntico, palavra por palavra, na mesma ordem. Nunca remova uma regra que o pedido não mandou remover.`

export function stripCodeFence(raw: string): string {
  const texto = raw.trim()
  const abertura = /^```[^\n]*\n/
  if (!abertura.test(texto)) return texto

  const corpo = texto.replace(abertura, '')
  const fecho = corpo.lastIndexOf('```')
  return (fecho === -1 ? corpo : corpo.slice(0, fecho)).trim()
}

export async function proposePrompt(
  current: string,
  request: string,
): Promise<string> {
  const bruto = await complete([
    { role: 'system', content: PROPOSAL_INSTRUCTION },
    {
      role: 'user',
      content: `PROMPT ATUAL:\n${current}\n\nMUDANÇA PEDIDA:\n${request}`,
    },
  ])
  return stripCodeFence(bruto)
}
