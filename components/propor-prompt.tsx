'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AvisoRegras } from '@/components/aviso-regras'
import { diffLines } from '@/lib/diff'
import { missingHardRules } from '@/lib/regras-prompt'

const FALHA = 'Não consegui falar com o modelo. Tenta de novo.'
const VAZIO = 'O modelo não devolveu nada aproveitável. Tenta reescrever o pedido.'
const IGUAL = 'A proposta veio idêntica ao prompt atual: nada a aceitar.'

const estilo: Record<string, string> = {
  equal: 'text-[#6F6A62]',
  added: 'border-l-2 border-[#3E6B45] bg-[#16231A] text-[#A8D8AE]',
  removed: 'border-l-2 border-[#7A3B2A] bg-[#2A1714] text-[#E0BFB2]',
}

const marca: Record<string, string> = { equal: ' ', added: '+', removed: '−' }

export function ProporPrompt({ atual }: { atual: string }) {
  const [pedido, setPedido] = useState('')
  const [rodando, setRodando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [proposta, setProposta] = useState<string | null>(null)
  const [pedidoDaProposta, setPedidoDaProposta] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const router = useRouter()

  const linhas = proposta === null ? [] : diffLines(atual, proposta)
  const mudancas = linhas.filter((l) => l.kind !== 'equal').length
  const ausentes = proposta === null ? [] : missingHardRules(proposta)

  function descartar() {
    setProposta(null)
    setConfirmando(false)
    setAviso(null)
  }

  async function propor() {
    setRodando(true)
    setAviso(null)
    setProposta(null)
    setConfirmando(false)
    try {
      const resposta = await fetch('/admin/api/prompt/propor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      const dados = (await resposta.json().catch(() => null)) as {
        proposta?: string | null
      } | null
      if (!dados?.proposta) {
        setAviso(VAZIO)
        return
      }
      if (dados.proposta === atual) {
        setAviso(IGUAL)
        return
      }
      setProposta(dados.proposta)
      setPedidoDaProposta(pedido)
    } catch {
      setAviso(FALHA)
    } finally {
      setRodando(false)
    }
  }

  async function aceitar() {
    if (proposta === null) return
    setSalvando(true)
    setAviso(null)
    try {
      const resposta = await fetch('/admin/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: proposta,
          origem: 'ia',
          pedido: pedidoDaProposta,
        }),
      })
      if (!resposta.ok) {
        setAviso(FALHA)
        return
      }
      setProposta(null)
      setConfirmando(false)
      setPedido('')
      router.refresh()
    } catch {
      setAviso(FALHA)
    } finally {
      setSalvando(false)
    }
  }

  function pedirAceite() {
    if (ausentes.length > 0 && !confirmando) {
      setConfirmando(true)
      return
    }
    aceitar()
  }

  return (
    <section className="flex flex-col gap-3 border-t border-[#2A2722] pt-7">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A19A8E]">
        Pedir uma mudança para a IA
      </h2>

      <textarea
        value={pedido}
        onChange={(evento) => setPedido(evento.target.value)}
        placeholder="faça ele perguntar sobre o orçamento disponível"
        className="min-h-24 w-full rounded-xl border border-[#2A2722] bg-[#1F1D19] p-4 text-[14px] leading-relaxed text-[#E6E1D8] outline-none placeholder:text-[#6F6A62] focus:border-[#45403A]"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={propor}
          disabled={rodando || pedido.trim() === ''}
          className="min-h-11 rounded-[9px] border border-[#45403A] px-4 text-[13px] font-semibold text-[#C9C2B6] disabled:opacity-50"
        >
          {rodando ? 'Pensando…' : 'Propor'}
        </button>
        {aviso ? (
          <span role="status" className="text-[12px] leading-snug text-[#D98A6E]">
            {aviso}
          </span>
        ) : null}
      </div>

      {proposta === null ? null : (
        <div className="flex flex-col gap-3">
          <span className="text-[13px] text-[#A19A8E]">
            {mudancas === 1 ? '1 linha mudou' : `${mudancas} linhas mudaram`}. Nada
            foi salvo ainda.
          </span>

          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#2A2722] bg-[#1F1D19] p-3">
            {linhas.map((linha, indice) => (
              <p
                key={indice}
                className={`whitespace-pre-wrap px-2 py-0.5 text-[13px] leading-snug ${estilo[linha.kind]}`}
              >
                <span className="mr-2 select-none">{marca[linha.kind]}</span>
                {linha.text === '' ? ' ' : linha.text}
              </p>
            ))}
          </div>

          <AvisoRegras ausentes={ausentes} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={pedirAceite}
              disabled={salvando}
              className="min-h-11 rounded-[9px] border border-[#5C4228] bg-[#2A2018] px-4 text-[13px] font-semibold text-[#E5924F] disabled:opacity-50"
            >
              {salvando
                ? 'Salvando…'
                : confirmando
                  ? 'Aceitar mesmo assim'
                  : 'Aceitar'}
            </button>
            <button
              type="button"
              onClick={descartar}
              disabled={salvando}
              className="min-h-11 rounded-[9px] border border-[#45403A] px-4 text-[13px] font-semibold text-[#A19A8E] disabled:opacity-50"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
