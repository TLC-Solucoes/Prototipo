'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SEM_RESUMO =
  'Não saiu resumo: conversa curta demais ou o modelo não devolveu nada aproveitável.'

const FALHA = 'Não consegui falar com o servidor. Tenta de novo.'

export function BotaoResumo({ id, rotulo }: { id: string; rotulo: string }) {
  const [rodando, setRodando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const router = useRouter()

  async function gerar() {
    setRodando(true)
    setAviso(null)
    try {
      const resposta = await fetch('/admin/api/resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      const dados = (await resposta.json().catch(() => null)) as {
        gerou?: boolean
      } | null
      if (dados?.gerou) router.refresh()
      else setAviso(SEM_RESUMO)
    } catch {
      setAviso(FALHA)
    } finally {
      setRodando(false)
    }
  }

  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={gerar}
        disabled={rodando}
        aria-busy={rodando}
        className="min-h-11 shrink-0 rounded-[9px] border border-[#45403A] px-3.5 text-[13px] font-semibold text-[#C9C2B6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9793F] disabled:opacity-50"
      >
        {rodando ? 'Gerando…' : rotulo}
      </button>
      {aviso ? (
        <span role="status" className="max-w-[260px] text-right text-[12px] leading-snug text-[#D98A6E]">
          {aviso}
        </span>
      ) : null}
    </span>
  )
}
