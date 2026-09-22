import type { Summary } from '@/lib/types'

export const SUMMARY_INSTRUCTION = `Leia a conversa abaixo entre um consultor da TLC Soluções e um visitante, e devolva um único objeto JSON, sem nenhum texto antes ou depois, com exatamente estas chaves:

{
  "segmento": "ramo do negócio, ou null",
  "porte": "tamanho do negócio, ou null",
  "papel": "papel do visitante no negócio, ou null",
  "dorPrincipal": "a tarefa repetitiva que dói, na linguagem do visitante, ou null",
  "frequencia": "com que frequência acontece, ou null",
  "tempoGasto": "tempo gasto por semana ou por dia, ou null",
  "responsavel": "quem faz a tarefa hoje, ou null",
  "consequencia": "o que acontece quando falha, ou null",
  "ferramentas": ["ferramentas citadas"],
  "urgencia": "alta, media, baixa ou null",
  "adequacaoIcp": "sim, nao ou incerto",
  "contato": { "nome": null, "email": null, "telefone": null }
}

Use null para o que a conversa não disser. Não invente nada. adequacaoIcp é "sim" quando há uma tarefa repetitiva e frequente com dados já em meio digital, "nao" quando o visitante quer um sistema inteiro ou não tem processo definido, e "incerto" quando não dá para saber.`

const URGENCIAS = ['alta', 'media', 'baixa'] as const
const ADEQUACOES = ['sim', 'nao', 'incerto'] as const

function texto(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const limpo = value.trim()
  return limpo === '' ? null : limpo
}

function lista(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(texto).filter((v): v is string => v !== null)
  }
  const unico = texto(value)
  return unico ? [unico] : []
}

const CHAVES_CONHECIDAS = [
  'segmento', 'porte', 'papel', 'dorPrincipal', 'frequencia', 'tempoGasto',
  'responsavel', 'consequencia', 'ferramentas', 'urgencia', 'adequacaoIcp',
  'contato',
]

function candidatosJson(raw: string): string[] {
  const candidatos: string[] = []
  let profundidade = 0
  let inicio = -1
  let dentroDeString = false
  let escapado = false

  for (let i = 0; i < raw.length; i++) {
    const caractere = raw[i]
    if (dentroDeString) {
      if (escapado) escapado = false
      else if (caractere === '\\') escapado = true
      else if (caractere === '"') dentroDeString = false
      continue
    }
    if (caractere === '"') {
      dentroDeString = true
    } else if (caractere === '{') {
      if (profundidade === 0) inicio = i
      profundidade++
    } else if (caractere === '}' && profundidade > 0) {
      profundidade--
      if (profundidade === 0) {
        candidatos.push(raw.slice(inicio, i + 1))
      }
    }
  }
  return candidatos
}

function extrairJson(raw: string): unknown {
  let escolhido: Record<string, unknown> | null = null
  let melhorPontuacao = -1

  for (const candidato of candidatosJson(raw)) {
    let valor: unknown
    try {
      valor = JSON.parse(candidato)
    } catch {
      continue
    }
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) continue

    const objeto = valor as Record<string, unknown>
    const pontuacao = CHAVES_CONHECIDAS.filter((chave) => chave in objeto).length
    if (pontuacao >= melhorPontuacao) {
      melhorPontuacao = pontuacao
      escolhido = objeto
    }
  }

  return escolhido
}

export function parseSummary(raw: string): Summary | null {
  const dados = extrairJson(raw)
  if (dados === null || typeof dados !== 'object') return null

  const d = dados as Record<string, unknown>
  const urgencia = texto(d.urgencia)
  const adequacao = texto(d.adequacaoIcp)
  const contato = (typeof d.contato === 'object' && d.contato !== null
    ? d.contato
    : {}) as Record<string, unknown>

  return {
    segmento: texto(d.segmento),
    porte: texto(d.porte),
    papel: texto(d.papel),
    dorPrincipal: texto(d.dorPrincipal),
    frequencia: texto(d.frequencia),
    tempoGasto: texto(d.tempoGasto),
    responsavel: texto(d.responsavel),
    consequencia: texto(d.consequencia),
    ferramentas: lista(d.ferramentas),
    urgencia: URGENCIAS.includes(urgencia as never)
      ? (urgencia as Summary['urgencia'])
      : null,
    adequacaoIcp: ADEQUACOES.includes(adequacao as never)
      ? (adequacao as Summary['adequacaoIcp'])
      : 'incerto',
    contato: {
      nome: texto(contato.nome),
      email: texto(contato.email),
      telefone: texto(contato.telefone),
    },
  }
}
