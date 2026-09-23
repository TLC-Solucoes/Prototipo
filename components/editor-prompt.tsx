'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AvisoRegras } from '@/components/aviso-regras'
import { missingHardRules } from '@/lib/regras-prompt'

const FALHA = 'Não consegui salvar. Tenta de novo.'

export function EditorPrompt({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const router = useRouter()

  const ausentes = missingHardRules(texto)
  const mudou = texto !== inicial

  async function salvar() {
    setSalvando(true)
    setAviso(null)
    try {
      const resposta = await fetch('/admin/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: texto, origem: 'manual' }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      setConfirmando(false)
      router.refresh()
    } catch {
      setAviso(FALHA)
    } finally {
      setSalvando(false)
    }
  }

  function pedirSalvar() {
    if (ausentes.length > 0 && !confirmando) {
      setConfirmando(true)
      return
    }
    salvar()
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A19A8E]">
          Prompt em uso
        </h2>
        <span className="text-[12px] text-[#6F6A62]">
          {texto.length} caracteres
        </span>
      </div>

      <textarea
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value)
          setConfirmando(false)
        }}
        spellCheck={false}
        className="min-h-[460px] w-full rounded-xl border border-[#2A2722] bg-[#1F1D19] p-4 text-[14px] leading-relaxed text-[#E6E1D8] outline-none focus:border-[#45403A]"
      />

      <AvisoRegras ausentes={ausentes} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pedirSalvar}
          disabled={salvando || !mudou}
          className="min-h-11 rounded-[9px] border border-[#45403A] px-4 text-[13px] font-semibold text-[#C9C2B6] disabled:opacity-50"
        >
          {salvando
            ? 'Salvando…'
            : confirmando
              ? 'Salvar mesmo assim'
              : 'Salvar prompt'}
        </button>
        {confirmando ? (
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={salvando}
            className="min-h-11 rounded-[9px] border border-[#45403A] px-4 text-[13px] font-semibold text-[#A19A8E] disabled:opacity-50"
          >
            Cancelar
          </button>
        ) : null}
        {!mudou ? (
          <span className="text-[12px] text-[#6F6A62]">
            Nada mudou desde a versão em uso.
          </span>
        ) : null}
        {aviso ? (
          <span role="status" className="text-[12px] text-[#D98A6E]">
            {aviso}
          </span>
        ) : null}
      </div>
    </section>
  )
}
