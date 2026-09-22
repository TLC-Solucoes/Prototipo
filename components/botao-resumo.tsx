'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function BotaoResumo({ id, rotulo }: { id: string; rotulo: string }) {
  const [rodando, setRodando] = useState(false)
  const router = useRouter()

  async function gerar() {
    setRodando(true)
    try {
      await fetch('/admin/api/resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } finally {
      setRodando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={gerar}
      disabled={rodando}
      className="min-h-11 shrink-0 rounded-[9px] border border-[#45403A] px-3.5 text-[13px] font-semibold text-[#C9C2B6] disabled:opacity-50"
    >
      {rodando ? 'Gerando…' : rotulo}
    </button>
  )
}
