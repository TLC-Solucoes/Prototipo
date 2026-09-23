'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FALHA = 'Não consegui restaurar. Tenta de novo.'

export function BotaoRestaurar({ id }: { id: number }) {
  const [rodando, setRodando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const router = useRouter()

  async function restaurar() {
    setRodando(true)
    setAviso(null)
    try {
      const resposta = await fetch('/admin/api/prompt/restaurar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      router.refresh()
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
        onClick={restaurar}
        disabled={rodando}
        className="min-h-11 rounded-[9px] border border-[#45403A] px-3.5 text-[13px] font-semibold text-[#C9C2B6] disabled:opacity-50"
      >
        {rodando ? 'Restaurando…' : 'Restaurar'}
      </button>
      {aviso ? (
        <span role="status" className="text-[12px] text-[#D98A6E]">
          {aviso}
        </span>
      ) : null}
    </span>
  )
}
