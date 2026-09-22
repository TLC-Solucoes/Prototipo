import { describe, expect, it } from 'vitest'
import { parseSummary } from '@/lib/summary'

const completo = JSON.stringify({
  segmento: 'Clínica de fisioterapia',
  porte: '4 profissionais',
  papel: 'Sócia',
  dorPrincipal: 'Confirmação de consulta uma a uma no WhatsApp',
  frequencia: 'Diária',
  tempoGasto: '2 h por dia',
  responsavel: 'Recepcionista',
  consequencia: '6 sessões perdidas na semana passada',
  ferramentas: ['WhatsApp', 'Agenda em papel'],
  urgencia: 'alta',
  adequacaoIcp: 'sim',
  contato: { nome: 'Marina', email: null, telefone: '11999999999' },
})

describe('parseSummary', () => {
  it('lê json limpo', () => {
    const s = parseSummary(completo)
    expect(s?.dorPrincipal).toBe('Confirmação de consulta uma a uma no WhatsApp')
    expect(s?.contato.nome).toBe('Marina')
  })

  it('lê json dentro de cerca de código', () => {
    const s = parseSummary('```json\n' + completo + '\n```')
    expect(s?.segmento).toBe('Clínica de fisioterapia')
  })

  it('lê json cercado de conversa', () => {
    const s = parseSummary(`Claro! Segue o resumo:\n${completo}\nEspero ter ajudado.`)
    expect(s?.urgencia).toBe('alta')
  })

  it('devolve null para texto sem json', () => {
    expect(parseSummary('desculpe, não consegui')).toBeNull()
  })

  it('devolve null para json malformado', () => {
    expect(parseSummary('{ "segmento": "Loja", ')).toBeNull()
  })

  it('preenche campos ausentes com null', () => {
    const s = parseSummary('{"dorPrincipal": "estoque na mão"}')
    expect(s?.dorPrincipal).toBe('estoque na mão')
    expect(s?.segmento).toBeNull()
    expect(s?.contato.nome).toBeNull()
  })

  it('normaliza ferramentas que vieram como string', () => {
    const s = parseSummary('{"ferramentas": "WhatsApp"}')
    expect(s?.ferramentas).toEqual(['WhatsApp'])
  })

  it('descarta urgencia fora do domínio', () => {
    const s = parseSummary('{"urgencia": "urgentíssima"}')
    expect(s?.urgencia).toBeNull()
  })

  it('assume icp incerto quando o valor não é reconhecido', () => {
    const s = parseSummary('{"adequacaoIcp": "talvez"}')
    expect(s?.adequacaoIcp).toBe('incerto')
  })

  it('descarta string vazia de contato', () => {
    const s = parseSummary('{"contato": {"nome": "", "telefone": "  "}}')
    expect(s?.contato.nome).toBeNull()
    expect(s?.contato.telefone).toBeNull()
  })

  it('escolhe o objeto certo quando vem prosa com chaves depois do json', () => {
    const s = parseSummary(`Segue o resumo:\n${completo}\nEspero ter ajudado! {abraços}`)
    expect(s?.dorPrincipal).toBe('Confirmação de consulta uma a uma no WhatsApp')
  })

  it('prefere o resumo mais completo quando vêm dois objetos', () => {
    const rascunho = JSON.stringify({ segmento: 'Clínica' })
    const s = parseSummary(`${rascunho}\n\nCorrigindo:\n${completo}`)
    expect(s?.contato.nome).toBe('Marina')
    expect(s?.tempoGasto).toBe('2 h por dia')
  })

  it('ignora chaves dentro de string sem se perder', () => {
    const s = parseSummary('{"segmento": "Empresa {ABC} Ltda", "ferramentas": []}')
    expect(s?.segmento).toBe('Empresa {ABC} Ltda')
  })

  it('continua devolvendo null para json malformado', () => {
    expect(parseSummary('{ "segmento": "Loja", ')).toBeNull()
  })
})
