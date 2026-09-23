import { describe, expect, it } from 'vitest'
import { diffLines } from '@/lib/diff'

describe('diffLines', () => {
  it('não acusa mudança entre textos idênticos', () => {
    const texto = 'primeira\nsegunda\nterceira'
    expect(diffLines(texto, texto)).toEqual([
      { kind: 'equal', text: 'primeira' },
      { kind: 'equal', text: 'segunda' },
      { kind: 'equal', text: 'terceira' },
    ])
  })

  it('marca a linha acrescentada e preserva o resto', () => {
    expect(diffLines('primeira\nterceira', 'primeira\nsegunda\nterceira')).toEqual([
      { kind: 'equal', text: 'primeira' },
      { kind: 'added', text: 'segunda' },
      { kind: 'equal', text: 'terceira' },
    ])
  })

  it('marca a linha removida', () => {
    expect(diffLines('primeira\nsegunda\nterceira', 'primeira\nterceira')).toEqual([
      { kind: 'equal', text: 'primeira' },
      { kind: 'removed', text: 'segunda' },
      { kind: 'equal', text: 'terceira' },
    ])
  })

  it('trata linha trocada como remoção seguida de acréscimo', () => {
    expect(diffLines('primeira\nsegunda\nterceira', 'primeira\noutra\nterceira')).toEqual([
      { kind: 'equal', text: 'primeira' },
      { kind: 'removed', text: 'segunda' },
      { kind: 'added', text: 'outra' },
      { kind: 'equal', text: 'terceira' },
    ])
  })

  it('acrescenta no fim sem desalinhar o começo', () => {
    expect(diffLines('a\nb', 'a\nb\nc')).toEqual([
      { kind: 'equal', text: 'a' },
      { kind: 'equal', text: 'b' },
      { kind: 'added', text: 'c' },
    ])
  })

  it('vê texto vazio virando conteúdo como acréscimo', () => {
    expect(diffLines('', 'a')).toEqual([
      { kind: 'removed', text: '' },
      { kind: 'added', text: 'a' },
    ])
  })
})
