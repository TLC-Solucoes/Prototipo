import OpenAI from 'openai'
import type { ChatMessage } from '@/lib/prompt'

function client(): OpenAI {
  return new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })
}

function chatModel(): string {
  return process.env.MODEL_NAME!
}

export function extractModel(): string {
  return process.env.MODEL_NAME_EXTRACT || process.env.MODEL_NAME!
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
