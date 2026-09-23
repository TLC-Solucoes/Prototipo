'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FALHA = 'Não consegui apagar. Tenta de novo.'
const SUMIU = 'Essa conversa já não está mais no banco.'

function descrever(
  nome: string | null,
  segmento: string | null,
  mensagens: number,
): string {
  const plural = mensagens === 1 ? '1 mensagem' : `${mensagens} mensagens`
  if (nome) return `Apagar a conversa de ${nome} (${plural})?`
  if (segmento) return `Apagar a conversa de ${segmento}, sem contato (${plural})?`
  return `Apagar esta conversa sem contato (${plural})?`
}

export function BotaoApagar({
  id,
  nome,
  segmento,
  mensagens,
  voltarPara,
}: {
  id: string
  nome: string | null
  segmento: string | null
  mensagens: number
  voltarPara?: string
}) {
  const [perguntando, setPerguntando] = useState(false)
  const [rodando, setRodando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const router = useRouter()

  async function apagar() {
    setRodando(true)
    setAviso(null)
    try {
      const resposta = await fetch('/admin/api/apagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      const dados = (await resposta.json().catch(() => null)) as {
        apagou?: boolean
      } | null
      if (!dados?.apagou) {
        setAviso(SUMIU)
        return
      }
      if (voltarPara) router.push(voltarPara)
      router.refresh()
    } catch {
      setAviso(FALHA)
    } finally {
      setRodando(false)
      setPerguntando(false)
    }
  }

  if (!perguntando) {
    return (
      <span className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setPerguntando(true)}
          className="min-h-11 shrink-0 rounded-[9px] border border-[#45403A] px-3.5 text-[13px] font-semibold text-[#A19A8E]"
        >
          Apagar
        </button>
        {aviso ? (
          <span
            role="status"
            className="max-w-[260px] text-right text-[12px] leading-snug text-[#D98A6E]"
          >
            {aviso}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="text-[13px] leading-snug text-[#E0BFB2]">
        {descrever(nome, segmento, mensagens)}
      </span>
      <button
        type="button"
        onClick={apagar}
        disabled={rodando}
        className="min-h-11 shrink-0 rounded-[9px] border border-[#7A3B2A] bg-[#2A1714] px-3.5 text-[13px] font-semibold text-[#E08C55] disabled:opacity-50"
      >
        {rodando ? 'Apagando…' : 'Confirmar'}
      </button>
      <button
        type="button"
        onClick={() => setPerguntando(false)}
        disabled={rodando}
        className="min-h-11 shrink-0 rounded-[9px] border border-[#45403A] px-3.5 text-[13px] font-semibold text-[#C9C2B6] disabled:opacity-50"
      >
        Cancelar
      </button>
    </span>
  )
}
