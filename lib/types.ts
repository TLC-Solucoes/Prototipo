export type Role = 'user' | 'assistant'

export type Summary = {
  segmento: string | null
  porte: string | null
  papel: string | null
  dorPrincipal: string | null
  frequencia: string | null
  tempoGasto: string | null
  responsavel: string | null
  consequencia: string | null
  ferramentas: string[]
  urgencia: 'alta' | 'media' | 'baixa' | null
  adequacaoIcp: 'sim' | 'nao' | 'incerto'
  contato: {
    nome: string | null
    email: string | null
    telefone: string | null
  }
}

export type Conversation = {
  id: string
  createdAt: Date
  status: 'aberta' | 'com_contato'
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  summary: Summary | null
  summaryUpdatedAt: Date | null
  summaryAttemptedAt: Date | null
  summaryInputHash: string | null
}

export type Message = {
  id: number
  role: Role
  content: string
  incomplete: boolean
  createdAt: Date
}

export type AdminRow = {
  id: string
  createdAt: Date
  status: 'aberta' | 'com_contato'
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  dorPrincipal: string | null
  segmento: string | null
  messageCount: number
  temResumo: boolean
  desatualizado: boolean
}

export type ConversationSlot =
  | { id: string }
  | { id: null; motivo: 'ip' | 'global' }

export type PromptOrigem = 'manual' | 'ia'

export type PromptVersion = {
  id: number
  conteudo: string
  criadoEm: Date
  origem: PromptOrigem
  pedido: string | null
}
