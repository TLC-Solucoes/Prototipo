import { describe, expect, it } from 'vitest'
import {
  clientIp,
  conversationCookieHeader,
  readConversationId,
} from '@/lib/session'

function req(headers: Record<string, string>) {
  return { headers: new Headers(headers) } as never
}

function comCookie(valor: string | undefined) {
  return {
    cookies: { get: () => (valor === undefined ? undefined : { value: valor }) },
  } as never
}

describe('conversationCookieHeader', () => {
  it('inclui o id', () => {
    expect(conversationCookieHeader('abc-123')).toContain('abc-123')
  })

  it('é httpOnly', () => {
    expect(conversationCookieHeader('abc')).toContain('HttpOnly')
  })

  it('usa SameSite Lax', () => {
    expect(conversationCookieHeader('abc')).toContain('SameSite=Lax')
  })

  it('dura duas horas, não a semana inteira', () => {
    expect(conversationCookieHeader('abc')).toContain('Max-Age=7200')
  })
})

describe('clientIp', () => {
  it('lê o primeiro ip de x-forwarded-for', () => {
    expect(clientIp(req({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1' }))).toBe('200.1.2.3')
  })

  it('ignora espaço em volta', () => {
    expect(clientIp(req({ 'x-forwarded-for': '  200.1.2.3  ' }))).toBe('200.1.2.3')
  })

  it('cai para um valor fixo sem o header', () => {
    expect(clientIp(req({}))).toBe('desconhecido')
  })
})

describe('readConversationId', () => {
  it('devolve o uuid do cookie', () => {
    const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    expect(readConversationId(comCookie(id))).toBe(id)
  })

  it('aceita uuid em maiúsculas', () => {
    const id = '3F2504E0-4F89-41D3-9A0C-0305E82C3301'
    expect(readConversationId(comCookie(id))).toBe(id)
  })

  it('devolve null sem cookie', () => {
    expect(readConversationId(comCookie(undefined))).toBeNull()
  })

  it('trata cookie truncado como ausente', () => {
    expect(readConversationId(comCookie('3f2504e0-4f89-41d3'))).toBeNull()
  })

  it('trata cookie adulterado como ausente', () => {
    expect(readConversationId(comCookie("1' or '1'='1"))).toBeNull()
  })

  it('trata cookie vazio como ausente', () => {
    expect(readConversationId(comCookie(''))).toBeNull()
  })
})
