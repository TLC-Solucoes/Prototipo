import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  process.env.IP_HASH_SALT = 'salt-de-teste'
})

describe('hashIp', () => {
  it('produz o mesmo hash para o mesmo ip', async () => {
    const { hashIp } = await import('@/lib/hash')
    expect(hashIp('200.1.2.3')).toBe(hashIp('200.1.2.3'))
  })

  it('produz hashes diferentes para ips diferentes', async () => {
    const { hashIp } = await import('@/lib/hash')
    expect(hashIp('200.1.2.3')).not.toBe(hashIp('200.1.2.4'))
  })

  it('não devolve o ip em claro', async () => {
    const { hashIp } = await import('@/lib/hash')
    expect(hashIp('200.1.2.3')).not.toContain('200.1.2.3')
  })
})

describe('hashTranscript', () => {
  it('muda quando uma mensagem é acrescentada', async () => {
    const { hashTranscript } = await import('@/lib/hash')
    const antes = hashTranscript([{ role: 'user', content: 'oi' }])
    const depois = hashTranscript([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'opa' },
    ])
    expect(antes).not.toBe(depois)
  })

  it('não muda para o mesmo transcript', async () => {
    const { hashTranscript } = await import('@/lib/hash')
    const messages = [{ role: 'user' as const, content: 'tenho uma clínica' }]
    expect(hashTranscript(messages)).toBe(hashTranscript(messages))
  })

  it('distingue quem disse o quê', async () => {
    const { hashTranscript } = await import('@/lib/hash')
    const a = hashTranscript([{ role: 'user', content: 'oi' }])
    const b = hashTranscript([{ role: 'assistant', content: 'oi' }])
    expect(a).not.toBe(b)
  })
})
