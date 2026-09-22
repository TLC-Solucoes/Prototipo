'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ABERTURA } from '@/lib/abertura'

const FALHA =
  'Não consegui responder agora. Tenta mandar de novo daqui a pouco.'

const INATIVIDADE_MS = 45_000

type Bolha = { role: 'user' | 'assistant'; content: string }

export function Chat() {
  const [mensagens, setMensagens] = useState<Bolha[]>([
    { role: 'assistant', content: ABERTURA },
  ])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  const pedirResumo = useCallback(() => {
    fetch('/api/summarize', { method: 'POST', keepalive: true }).catch(() => {})
  }, [])

  const agendarResumo = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(pedirResumo, INATIVIDADE_MS)
  }, [pedirResumo])

  useEffect(() => {
    function aoEsconder() {
      if (document.visibilityState !== 'hidden') return
      if (temporizador.current) clearTimeout(temporizador.current)
      pedirResumo()
    }
    document.addEventListener('visibilitychange', aoEsconder)
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder)
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [pedirResumo])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  function trocarUltima(conteudo: string) {
    setMensagens((atuais) => {
      const copia = [...atuais]
      copia[copia.length - 1] = { role: 'assistant', content: conteudo }
      return copia
    })
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const limpo = texto.trim()
    if (!limpo || enviando) return

    setTexto('')
    setEnviando(true)
    setMensagens((atuais) => [
      ...atuais,
      { role: 'user', content: limpo },
      { role: 'assistant', content: '' },
    ])

    let acumulado = ''
    try {
      const resposta = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: limpo }),
      })
      if (!resposta.ok || !resposta.body) {
        trocarUltima(FALHA)
        return
      }
      const leitor = resposta.body.getReader()
      const decodificador = new TextDecoder()
      for (;;) {
        const { done, value } = await leitor.read()
        if (done) break
        acumulado += decodificador.decode(value, { stream: true })
        trocarUltima(acumulado)
      }
    } catch {
      trocarUltima(FALHA)
    } finally {
      setEnviando(false)
      agendarResumo()
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#2A2722] px-5 sm:h-[68px] sm:px-10">
        <div className="flex items-baseline gap-2.5">
          <span className="font-[family-name:var(--font-display)] text-[19px] font-semibold tracking-tight sm:text-[21px]">
            TLC
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#A19A8E] sm:text-[13px]">
            Soluções
          </span>
        </div>
        <span className="hidden text-[13px] text-[#A19A8E] sm:block">
          Automação para negócio pequeno
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-2 pt-6 sm:px-10 sm:pt-9">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-5 sm:gap-6">
          {mensagens.map((mensagem, indice) =>
            mensagem.role === 'assistant' ? (
              <p
                key={indice}
                className="text-[16px] leading-relaxed text-[#E6E1D8] sm:text-[18px]"
              >
                {mensagem.content}
                {enviando && indice === mensagens.length - 1 ? (
                  <span className="ml-1 inline-block h-[17px] w-[8px] align-[-3px] bg-[#D9793F] sm:h-[19px] sm:w-[9px]" />
                ) : null}
              </p>
            ) : (
              <div key={indice} className="flex justify-end">
                <p className="max-w-[268px] rounded-[15px] rounded-br-[4px] border border-[#33302A] bg-[#26231F] px-4 py-3 text-[15px] leading-normal sm:max-w-[480px] sm:text-[17px]">
                  {mensagem.content}
                </p>
              </div>
            ),
          )}
          <div ref={fim} />
        </div>
      </main>

      <div className="shrink-0 px-5 pb-6 pt-3 sm:px-10 sm:pb-10 sm:pt-4">
        <form
          onSubmit={enviar}
          className="mx-auto flex w-full max-w-[680px] items-end gap-3 rounded-[15px] border border-[#33302A] bg-[#1C1A17] py-3 pl-4 pr-3 sm:rounded-2xl sm:pl-5"
        >
          <label htmlFor="mensagem" className="sr-only">
            Sua mensagem
          </label>
          <input
            id="mensagem"
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua resposta…"
            maxLength={2000}
            autoComplete="off"
            className="h-7 flex-1 bg-transparent text-[16px] text-[#F2EFE9] placeholder:text-[#6F6A62] focus:outline-none sm:text-[17px]"
          />
          <button
            type="submit"
            disabled={enviando || texto.trim() === ''}
            aria-label="Enviar mensagem"
            className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[#D9793F] disabled:bg-[#33302A]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={enviando || texto.trim() === '' ? '#A19A8E' : '#12110F'}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
        <p className="mx-auto mt-2.5 max-w-[680px] text-center text-[11px] text-[#6F6A62] sm:text-[12px]">
          Suas respostas ficam com a TLC Soluções e servem pra montar sua proposta.
          Este assistente não passa preço nem prazo.
        </p>
      </div>
    </div>
  )
}
