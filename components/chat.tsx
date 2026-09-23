'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ABERTURA } from '@/lib/abertura'

const FALHA =
  'Não consegui responder agora. Tenta mandar de novo daqui a pouco.'

const INATIVIDADE_MS = 45_000

type Bolha = { role: 'user' | 'assistant'; content: string; timestamp?: string }

function formatarHora(): string {
  const agora = new Date()
  return `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`
}

export function Chat() {
  const [mensagens, setMensagens] = useState<Bolha[]>([
    { role: 'assistant', content: ABERTURA },
  ])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [horaAtual, setHoraAtual] = useState('')
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hora = formatarHora()
    const t = setTimeout(() => {
      setHoraAtual(hora)
      setMensagens((atuais) =>
        atuais.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || hora,
        }))
      )
    }, 0)
    return () => clearTimeout(t)
  }, [])

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
      const ultima = copia[copia.length - 1]
      copia[copia.length - 1] = {
        role: 'assistant',
        content: conteudo,
        timestamp: ultima?.timestamp || formatarHora(),
      }
      return copia
    })
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const limpo = texto.trim()
    if (!limpo || enviando) return

    const hora = formatarHora()
    setTexto('')
    setEnviando(true)
    setMensagens((atuais) => [
      ...atuais,
      { role: 'user', content: limpo, timestamp: hora },
      { role: 'assistant', content: '', timestamp: hora },
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
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#E8ECE9] font-sans antialiased p-0 md:p-6 lg:p-8">
      <div className="flex w-full flex-col items-center justify-center">
        <div className="relative flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-[#F2F4F3] shadow-2xl rounded-none md:h-[760px] md:max-h-[calc(100dvh-2rem)] md:rounded-3xl border border-black/10">

          {/* Header Bar */}
          <header className="z-20 flex shrink-0 select-none items-center justify-between bg-[#081F26] px-4 py-3 text-white shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E353F] text-emerald-300 font-bold text-xs ring-1 ring-emerald-500/30">
                  <span className="material-symbols-outlined text-[22px] text-[#00E5C0]">chat</span>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00E5C0] ring-2 ring-[#081F26]"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-[15px] text-white tracking-tight">TLC Soluções</span>
                  <span className="material-symbols-outlined text-[16px] text-[#00E5C0]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <span className="flex items-center gap-1.5 truncate text-[11px] text-slate-300">
                  {enviando ? (
                    <span className="font-semibold italic text-[#00E5C0] animate-pulse">digitando...</span>
                  ) : (
                    <>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E5C0]"></span>
                      IA Corporativa • Online
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <button type="button" aria-label="Recarregar" className="rounded-full p-1 transition-colors hover:text-white hover:bg-white/10">
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
              <button type="button" aria-label="Informações" className="rounded-full p-1 transition-colors hover:text-white hover:bg-white/10">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
          </header>

          {/* Encryption Badge Banner */}
          <div className="z-10 bg-[#0E2830] px-4 py-1.5 text-center shadow-inner">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-300">
              <span className="material-symbols-outlined text-[13px] text-[#00E5C0]">verified_user</span>
              Ambiente seguro <span className="text-[#00E5C0] font-semibold">TLC Soluções</span> • Criptografia e Proteção de Dados
            </p>
          </div>

          {/* Chat Canvas Feed */}
          <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-[#F2F4F3] scroll-smooth focus:outline-none" tabIndex={0}>
            {/* Date marker */}
            <div className="my-1 flex justify-center">
              <span className="rounded-md bg-[#E1E6E3] px-3 py-0.5 text-[11px] font-semibold tracking-wider text-slate-600">
                HOJE
              </span>
            </div>

            {/* Message Feed */}
            {mensagens.map((mensagem, indice) =>
              mensagem.role === 'assistant' ? (
                <div key={indice} className="relative flex max-w-[90%] flex-col items-start my-1">
                  <div className="relative w-full rounded-2xl bg-white p-3.5 text-slate-800 shadow-sm border border-slate-200/60">
                    <div
                      className="text-[14px] leading-[20px] whitespace-pre-wrap font-normal"
                      aria-live={indice === mensagens.length - 1 ? 'polite' : undefined}
                    >
                      {mensagem.content}
                      {enviando && indice === mensagens.length - 1 && !mensagem.content ? (
                        <span className="ml-1.5 inline-block size-2 rounded-full bg-[#081F26] animate-pulse" aria-hidden="true" />
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center justify-end text-slate-400">
                      <span className="text-[11px]">{mensagem.timestamp || horaAtual}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div key={indice} className="flex w-full flex-col items-end my-1">
                  <div className="relative max-w-[85%] rounded-2xl bg-[#D0F8F3] p-3.5 text-slate-800 shadow-sm border border-[#A7F0E7]/60">
                    <p className="text-[14px] leading-[20px] whitespace-pre-wrap">{mensagem.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-[11px] text-slate-500">{mensagem.timestamp || horaAtual}</span>
                      <span className="material-symbols-outlined text-[15px] text-[#00A884] -mr-0.5 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                    </div>
                  </div>
                </div>
              )
            )}
            <div ref={fim} />
          </div>

          {/* Chat Input Dock */}
          <footer className="z-20 shrink-0 border-t border-slate-200/80 bg-white px-3 py-2.5">
            <form onSubmit={enviar} className="flex items-center gap-2">
              <label htmlFor="mensagem" className="sr-only">Digite sua dúvida ou mensagem...</label>
              <input
                id="mensagem"
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Digite sua dúvida ou mensagem..."
                maxLength={2000}
                autoComplete="off"
                className="flex-1 rounded-xl bg-[#F0F4F2] px-4 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#081F26]"
              />
              <button
                type="submit"
                disabled={enviando || texto.trim() === ''}
                aria-label={enviando ? 'Enviando...' : 'Enviar mensagem'}
                aria-busy={enviando}
                className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#081F26] text-[#00E5C0] shadow-sm transition-all hover:bg-[#0E2830] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </footer>
        </div>

        {/* Subtitle / Footer Meta Pill */}
        <div className="mt-3.5 px-4 text-center">
          <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[11px] font-medium tracking-wide text-slate-600 shadow-sm border border-slate-200/70">
            TLC Soluções • <span className="font-semibold text-slate-700">Tecnologia que Conecta e Transforma</span> • Atendimento 24/7
          </span>
        </div>
      </div>
    </main>
  )
}
