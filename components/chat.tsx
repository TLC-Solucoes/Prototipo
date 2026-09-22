'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { ABERTURA } from '@/lib/abertura'

const FALHA =
  'Não consegui responder agora. Tenta mandar de novo daqui a pouco.'

const INATIVIDADE_MS = 45_000

type Bolha = { role: 'user' | 'assistant'; content: string; hora: string }

function horaLocal() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

let horaDaAbertura = ''

function lerHoraDaAbertura() {
  if (!horaDaAbertura) horaDaAbertura = horaLocal()
  return horaDaAbertura
}

function semAtualizacoes() {
  return () => {}
}

function aindaSemHora() {
  return ''
}

function Rabicho({ cor, lado }: { cor: string; lado: 'esquerda' | 'direita' }) {
  return (
    <svg
      viewBox="0 0 8 13"
      width="8"
      height="13"
      aria-hidden="true"
      className={`absolute top-0 ${lado === 'esquerda' ? '-left-2' : '-right-2'}`}
    >
      <path
        d={
          lado === 'esquerda'
            ? 'M8 0H1.9C.3 0-.5 1.9.6 3L8 10.4V0z'
            : 'M0 0h6.1c1.6 0 2.4 1.9 1.3 3L0 10.4V0z'
        }
        fill={cor}
      />
    </svg>
  )
}

function Conferido() {
  return (
    <svg
      viewBox="0 0 16 11"
      width="15"
      height="11"
      fill="none"
      stroke="#53BDEB"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M1 5.8 3.5 8.4 8.6 1.6" />
      <path d="M6.9 5.8 9.4 8.4 14.5 1.6" />
    </svg>
  )
}

export function Chat() {
  const [mensagens, setMensagens] = useState<Bolha[]>([
    { role: 'assistant', content: ABERTURA, hora: '' },
  ])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fim = useRef<HTMLDivElement>(null)
  const horaAbertura = useSyncExternalStore(
    semAtualizacoes,
    lerHoraDaAbertura,
    aindaSemHora,
  )

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
        ...ultima,
        role: 'assistant',
        content: conteudo,
      }
      return copia
    })
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const limpo = texto.trim()
    if (!limpo || enviando) return

    setTexto('')
    setEnviando(true)
    const agora = horaLocal()
    setMensagens((atuais) => [
      ...atuais,
      { role: 'user', content: limpo, hora: agora },
      { role: 'assistant', content: '', hora: agora },
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
    <div className="flex h-dvh flex-col overflow-hidden bg-[#EFEAE2]">
      <header className="flex h-[59px] shrink-0 items-center bg-[#008069] px-4 sm:px-6">
        <span className="text-[15px] font-medium text-white sm:text-[16px]">
          Automação para negócio pequeno
        </span>
      </header>

      <main className="fundo-conversa flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-[680px] flex-col">
          {mensagens.map((mensagem, indice) => {
            const doVisitante = mensagem.role === 'user'
            const abreGrupo =
              indice === 0 || mensagens[indice - 1].role !== mensagem.role
            const espaco =
              indice === 0 ? '' : abreGrupo ? 'mt-3' : 'mt-[2px]'
            return (
              <div
                key={indice}
                className={`flex ${doVisitante ? 'justify-end' : 'justify-start'} ${espaco}`}
              >
                <div
                  className={`relative max-w-[75%] rounded-[7.5px] px-[9px] pb-[7px] pt-[6px] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] ${
                    doVisitante ? 'bg-[#D9FDD3]' : 'bg-white'
                  } ${
                    abreGrupo
                      ? doVisitante
                        ? 'rounded-tr-none'
                        : 'rounded-tl-none'
                      : ''
                  }`}
                >
                  {abreGrupo ? (
                    <Rabicho
                      cor={doVisitante ? '#D9FDD3' : '#FFFFFF'}
                      lado={doVisitante ? 'direita' : 'esquerda'}
                    />
                  ) : null}
                  <p
                    className={`whitespace-pre-wrap break-words text-[14.5px] leading-[20px] text-[#111B21] sm:text-[15.5px] sm:leading-[21px] ${
                      doVisitante ? 'pr-[62px]' : 'pr-[46px]'
                    }`}
                  >
                    {mensagem.content}
                    {!doVisitante &&
                    enviando &&
                    indice === mensagens.length - 1 ? (
                      <span className="ml-[3px] inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#667781]" />
                    ) : null}
                  </p>
                  <span className="absolute bottom-[5px] right-[7px] flex items-center gap-[3px] text-[11px] leading-none">
                    <span
                      className={doVisitante ? 'text-[#5C6B73]' : 'text-[#667781]'}
                    >
                      {mensagem.hora || horaAbertura}
                    </span>
                    {doVisitante ? <Conferido /> : null}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={fim} />
        </div>
      </main>

      <div className="shrink-0 bg-[#F0F2F5] px-3 pb-3 pt-2 sm:px-6">
        <form
          onSubmit={enviar}
          className="mx-auto flex w-full max-w-[680px] items-center gap-2"
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
            className="h-11 min-w-0 flex-1 rounded-[22px] bg-white px-4 text-[16px] text-[#111B21] placeholder:text-[#667781] focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando || texto.trim() === ''}
            aria-label="Enviar mensagem"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] disabled:bg-[#6E8A85]"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              aria-hidden="true"
            >
              <path d="M21.4 11.1 3.9 3.2c-.7-.3-1.4.4-1.1 1.1l2.4 6.1c.1.3.4.5.7.6l7.1 1-7.1 1c-.3.1-.6.3-.7.6l-2.4 6.1c-.3.7.4 1.4 1.1 1.1l17.5-7.9c.7-.3.7-1.5 0-1.8z" />
            </svg>
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-[680px] text-center text-[11px] leading-[15px] text-[#5C6B73] sm:text-[12px]">
          Suas respostas ficam com a TLC Soluções e servem pra montar sua proposta.
          Este assistente não passa preço nem prazo.
        </p>
      </div>
    </div>
  )
}
