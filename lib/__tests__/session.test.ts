import { describe, expect, it } from 'vitest'
import { clientIp, conversationCookieHeader } from '@/lib/session'

function req(headers: Record<string, string>) {
  return { headers: new Headers(headers) } as never
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
