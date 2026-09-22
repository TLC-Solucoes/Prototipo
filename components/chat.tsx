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
    <main className="relative flex min-h-screen w-full items-center justify-center wa-chat-bg font-sans antialiased">
      <div className="flex w-full flex-col items-center justify-center p-0 md:p-6 lg:p-8">
        <div className="relative flex h-[100dvh] w-full max-w-[500px] flex-col overflow-hidden bg-surface-container-high shadow-2xl rounded-none md:h-[750px] md:max-h-[calc(100dvh-3rem)] md:rounded-2xl">
          {/* Header Bar */}
          <header className="z-20 flex shrink-0 select-none items-center justify-between bg-primary-container px-3.5 py-2.5 text-on-primary shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                aria-label="Voltar"
                className="flex items-center -ml-1 text-on-primary/80 transition-colors hover:text-on-primary md:hidden"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <div className="relative shrink-0 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary font-bold text-sm shadow-sm ring-1 ring-white/20">
                  TLC
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-tertiary-fixed-dim ring-2 ring-primary-container"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate font-semibold text-[16px] text-on-primary tracking-tight">TLC Soluções</span>
                  <span className="inline-flex shrink-0 items-center justify-center text-tertiary-fixed-dim" title="Conta Oficial Verificada">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </span>
                </div>
                <span className="flex items-center gap-1 truncate text-[11px] text-primary-fixed">
                  {enviando ? (
                    <span className="font-semibold italic text-tertiary-fixed animate-pulse">digitando...</span>
                  ) : (
                    <>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                      Conta comercial oficial • Online agora
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-on-primary/90">
              <button type="button" aria-label="Chamada de Vídeo" className="hidden sm:inline-flex rounded-full p-1 transition-colors hover:bg-primary/20 hover:text-on-primary">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </button>
              <button type="button" aria-label="Chamada de Voz" className="hidden sm:inline-flex rounded-full p-1 transition-colors hover:bg-primary/20 hover:text-on-primary">
                <span className="material-symbols-outlined text-[19px]">call</span>
              </button>
              <button type="button" aria-label="Menu" className="rounded-full p-1 transition-colors hover:bg-primary/20 hover:text-on-primary">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </header>

          {/* Chat Canvas Feed */}
          <div className="relative flex-1 overflow-y-auto px-3.5 py-4 space-y-3 wa-chat-bg scroll-smooth focus:outline-none" tabIndex={0}>
            {/* Encryption notice */}
            <div className="my-1.5 flex justify-center">
              <div className="max-w-[85%] rounded-lg bg-surface-bright/95 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
                <p className="flex items-center justify-center gap-1 text-[11px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px] text-outline">lock</span>
                  As mensagens são protegidas com a criptografia de ponta a ponta da{' '}
                  <span className="font-medium text-primary">TLC Soluções</span>.
                </p>
              </div>
            </div>

            {/* Date marker */}
            <div className="my-2 flex justify-center">
              <span className="rounded-md bg-surface-container-high/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant shadow-sm">
                Hoje
              </span>
            </div>

            {/* Message Feed */}
            {mensagens.map((mensagem, indice) =>
              mensagem.role === 'assistant' ? (
                <div key={indice} className="relative flex max-w-[92%] sm:max-w-[82%] flex-col items-start my-1.5">
                  <div className="relative w-full rounded-2xl rounded-tl-none bg-surface-container-lowest p-3 text-on-surface shadow-sm">
                    <div className="absolute top-0 -left-2 h-0 w-0 border-t-[8px] border-t-surface-container-lowest border-l-[8px] border-l-transparent"></div>
                    <div
                      className="text-[14.2px] leading-[19.5px] whitespace-pre-wrap"
                      aria-live={indice === mensagens.length - 1 ? 'polite' : undefined}
                    >
                      {mensagem.content}
                      {enviando && indice === mensagens.length - 1 && !mensagem.content ? (
                        <span className="ml-1.5 inline-block size-2 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-outline">
                      <span className="text-[11px]">{mensagem.timestamp || horaAtual}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={indice} className="flex w-full flex-col items-end my-1.5">
                  <div className="relative max-w-[85%] rounded-2xl rounded-tr-none bg-[#DCF8C6] p-3 text-on-surface shadow-sm">
                    <div className="absolute top-0 -right-2 h-0 w-0 border-t-[8px] border-t-[#DCF8C6] border-r-[8px] border-r-transparent"></div>
                    <p className="text-[14.2px] leading-[19.5px] whitespace-pre-wrap">{mensagem.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-[11px] text-on-surface-variant/70">{mensagem.timestamp || horaAtual}</span>
                      <span className="material-symbols-outlined text-[15px] text-[#53BDEB] -mr-0.5 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                    </div>
                  </div>
                </div>
              )
            )}
            <div ref={fim} />
          </div>

          {/* Chat Input Dock */}
          <footer className="z-20 flex shrink-0 items-center gap-2 border-t-0 bg-surface-container-high px-2.5 py-2 shadow-inner">
            <div className="flex items-center text-outline">
              <button type="button" aria-label="Inserir Emoji" className="rounded-full p-1.5 text-outline transition-colors hover:text-on-surface">
                <span className="material-symbols-outlined text-[24px]">mood</span>
              </button>
              <button type="button" aria-label="Anexar Arquivo" className="-ml-1 rounded-full p-1.5 text-outline transition-colors hover:text-on-surface">
                <span className="material-symbols-outlined text-[24px]">attach_file</span>
              </button>
            </div>
            <form onSubmit={enviar} className="flex flex-1 items-center">
              <div className="relative flex w-full items-center">
                <label htmlFor="mensagem" className="sr-only">Sua mensagem</label>
                <input
                  id="mensagem"
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  maxLength={2000}
                  autoComplete="off"
                  className="w-full rounded-full bg-surface-container-lowest py-2.5 pl-4 pr-10 text-[14.2px] text-on-surface shadow-sm placeholder:text-outline focus:outline-none"
                />
                <button type="button" aria-label="Câmera" className="absolute right-3 text-outline transition-colors hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </button>
              </div>
            </form>
            <button
              type="submit"
              onClick={enviar}
              disabled={enviando || texto.trim() === ''}
              aria-label={enviando ? 'Enviando...' : 'Enviar mensagem'}
              aria-busy={enviando}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-md transition-all hover:bg-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </footer>
        </div>

        {/* Subtitle / Footer Meta */}
        <div className="mt-3 hidden px-4 text-center md:block">
          <p className="text-[11px] font-medium tracking-wide text-outline-variant">
            TLC Soluções • Tecnologia que Conecta e Transforma • Atendimento 24/7
          </p>
        </div>
      </div>
    </main>
  )
}
