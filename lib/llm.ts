import type { ChatMessage } from '@/lib/prompt'

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida`)
  return valor
}

function isDone(linha: string): boolean {
  return linha.startsWith('data:') && linha.slice(5).trim() === '[DONE]'
}

function deltaOf(linha: string): string | null {
  if (!linha.startsWith('data:')) return null
  const payload = linha.slice(5).trim()
  if (!payload) return null
  try {
    const chunk = JSON.parse(payload) as {
      choices?: { delta?: { content?: string | null } }[]
    }
    const texto = chunk.choices?.[0]?.delta?.content
    return typeof texto === 'string' && texto !== '' ? texto : null
  } catch {
    return null
  }
}

export async function* streamChat(
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const atual = messages[messages.length - 1]
  if (!atual || atual.content.trim() === '') {
    throw new Error('streamChat: a última mensagem não pode ser vazia')
  }

  const url = obrigatoria('AGENT_CHAT_URL')
  const apiKey = obrigatoria('AGENT_API_KEY')

  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      message: atual.content,
      history: messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
    }),
  })

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => '')
    throw new Error(
      `Agente respondeu ${resposta.status}${detalhe ? `: ${detalhe.slice(0, 300)}` : ''}`,
    )
  }
  if (!resposta.body) throw new Error('Agente respondeu sem corpo legível')

  const reader = resposta.body.getReader()
  const decoder = new TextDecoder()
  let pendente = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      const bloco = done
        ? decoder.decode()
        : decoder.decode(value, { stream: true })
      pendente += bloco

      const linhas = pendente.split('\n')
      pendente = done ? '' : (linhas.pop() ?? '')

      for (const linha of linhas) {
        if (isDone(linha)) return
        const texto = deltaOf(linha)
        if (texto) yield texto
      }

      if (done) return
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
}

export async function complete(messages: ChatMessage[]): Promise<string> {
  let texto = ''
  for await (const pedaco of streamChat(messages)) texto += pedaco
  return texto
}
