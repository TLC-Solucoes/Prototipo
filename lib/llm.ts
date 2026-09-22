import OpenAI from 'openai'
import type { ChatMessage } from '@/lib/prompt'

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida`)
  return valor
}

function client(): OpenAI {
  return new OpenAI({
    baseURL: obrigatoria('OPENAI_BASE_URL'),
    apiKey: process.env.OPENAI_API_KEY || 'sem-chave',
  })
}

function chatModel(): string {
  return obrigatoria('MODEL_NAME')
}

export function extractModel(): string {
  return process.env.MODEL_NAME_EXTRACT || chatModel()
}

export async function* streamChat(
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const stream = await client().chat.completions.create({
    model: chatModel(),
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 400,
  })

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content
    if (delta) yield delta
  }
}

export async function complete(
  messages: ChatMessage[],
  model = extractModel(),
): Promise<string> {
  const resposta = await client().chat.completions.create({
    model,
    messages,
    temperature: 0,
    max_tokens: 800,
  })
  return resposta.choices[0]?.message?.content ?? ''
}
