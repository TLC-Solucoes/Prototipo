import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BotaoApagar } from '@/components/botao-apagar'
import { BotaoResumo } from '@/components/botao-resumo'
import { getConversation, listMessages } from '@/lib/db'
import { hashTranscript } from '@/lib/hash'

export const dynamic = 'force-dynamic'

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

const campos: [string, (valor: string | null) => string][] = [
  ['Segmento', (v) => v ?? '—'],
  ['Porte', (v) => v ?? '—'],
  ['Papel', (v) => v ?? '—'],
  ['Dor principal', (v) => v ?? '—'],
  ['Frequência', (v) => v ?? '—'],
  ['Tempo gasto', (v) => v ?? '—'],
  ['Responsável', (v) => v ?? '—'],
  ['Consequência', (v) => v ?? '—'],
]

export default async function Conversa({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const conversa = await getConversation(id)
  if (!conversa) notFound()

  const mensagens = await listMessages(id)
  const resumo = conversa.summary
  const desatualizado =
    resumo !== null && conversa.summaryInputHash !== hashTranscript(mensagens)

  const valores: (string | null)[] = [
    resumo?.segmento ?? null,
    resumo?.porte ?? null,
    resumo?.papel ?? null,
    resumo?.dorPrincipal ?? null,
    resumo?.frequencia ?? null,
    resumo?.tempoGasto ?? null,
    resumo?.responsavel ?? null,
    resumo?.consequencia ?? null,
  ]

  return (
    <div className="min-h-dvh px-5 py-6 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2722] pb-5">
        <div className="flex flex-wrap items-baseline gap-4">
          <Link href="/admin" className="text-[14px] font-semibold text-[#A19A8E]">
            ← Conversas
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-[27px] font-semibold tracking-tight">
            {conversa.contactName ?? 'Sem contato'}
          </h1>
          <span className="text-[15px] text-[#A19A8E]">
            {conversa.contactPhone ?? conversa.contactEmail ?? '—'}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <span className="text-[13px] text-[#6F6A62]">
            {mensagens.length} mensagens
          </span>
          <BotaoApagar
            id={id}
            nome={conversa.contactName}
            segmento={resumo?.segmento ?? null}
            mensagens={mensagens.length}
            voltarPara="/admin"
          />
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_452px]">
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A19A8E]">
            Transcrição da Conversa
          </h2>
          {mensagens.map((mensagem) =>
            mensagem.role === 'assistant' ? (
              <div key={mensagem.id} className="flex justify-start">
                <div className="max-w-[540px] w-full rounded-2xl rounded-tl-none bg-surface-container-lowest p-3.5 text-[#111B21] shadow-md border border-[#E9EDEF]">
                  <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-[#F0F2F5] pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#075E54]">
                      Assistente
                    </span>
                    <span className="text-[11px] font-medium text-[#667781]">
                      {formatadorHora.format(mensagem.createdAt)}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#111B21] whitespace-pre-wrap">
                    {mensagem.content}
                    {mensagem.incomplete ? (
                      <span className="ml-2 text-[13px] font-semibold text-[#BA1A1A]">
                        (resposta cortada)
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : (
              <div key={mensagem.id} className="flex justify-end">
                <div className="max-w-[540px] w-full rounded-2xl rounded-tr-none bg-[#DCF8C6] p-3.5 text-[#111B21] shadow-md border border-[#BCE1A2]">
                  <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-[#C6E8AC] pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#075E54]">
                      Visitante
                    </span>
                    <span className="text-[11px] font-medium text-[#54656F]">
                      {formatadorHora.format(mensagem.createdAt)}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#111B21] whitespace-pre-wrap">
                    {mensagem.content}
                  </p>
                </div>
              </div>
            ),
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]">
              Resumo da dor
            </h2>
            <BotaoResumo id={id} rotulo={resumo ? 'Regerar' : 'Gerar resumo'} />
          </div>

          {desatualizado ? (
            <p className="rounded-xl border border-[#45302A] bg-[#231A18] px-4 py-3 text-[13px] leading-normal text-[#E0BFB2]">
              Desatualizado: há mensagens novas desde o último resumo.
            </p>
          ) : null}

          {resumo ? (
            <dl className="grid grid-cols-[116px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3">
              {campos.map(([rotulo, formatar], indice) => (
                <div key={rotulo} className="contents">
                  <dt className="text-[13px] text-[#6F6A62]">{rotulo}</dt>
                  <dd className="text-[15px] leading-normal">
                    {formatar(valores[indice])}
                  </dd>
                </div>
              ))}
              <dt className="text-[13px] text-[#6F6A62]">Ferramentas</dt>
              <dd className="flex flex-wrap gap-1.5">
                {resumo.ferramentas.length === 0 ? (
                  <span className="text-[15px]">—</span>
                ) : (
                  resumo.ferramentas.map((ferramenta) => (
                    <span
                      key={ferramenta}
                      className="rounded-md border border-[#383430] bg-[#1F1D19] px-2.5 py-1 text-[13px] text-[#C9C2B6]"
                    >
                      {ferramenta}
                    </span>
                  ))
                )}
              </dd>
              <dt className="text-[13px] text-[#6F6A62]">Urgência</dt>
              <dd className="text-[15px]">{resumo.urgencia ?? '—'}</dd>
              <dt className="text-[13px] text-[#6F6A62]">Perfil ICP</dt>
              <dd className="text-[15px]">{resumo.adequacaoIcp}</dd>
            </dl>
          ) : (
            <p className="text-[15px] text-[#6F6A62]">
              Ainda não há resumo para esta conversa.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
