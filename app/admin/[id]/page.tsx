import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BotaoResumo } from '@/components/botao-resumo'
import { getConversation, listMessages } from '@/lib/db'
import { hashTranscript } from '@/lib/hash'

export const dynamic = 'force-dynamic'

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
        <span className="text-[13px] text-[#6F6A62]">
          {mensagens.length} mensagens
        </span>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_452px]">
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]">
            Transcrição
          </h2>
          {mensagens.map((mensagem) =>
            mensagem.role === 'assistant' ? (
              <p
                key={mensagem.id}
                className="text-[15px] leading-relaxed text-[#C9C2B6]"
              >
                {mensagem.content}
                {mensagem.incomplete ? (
                  <span className="ml-2 text-[13px] text-[#D98A6E]">
                    (resposta cortada)
                  </span>
                ) : null}
              </p>
            ) : (
              <div key={mensagem.id} className="flex justify-end">
                <p className="max-w-[400px] rounded-[14px] rounded-br-[4px] border border-[#33302A] bg-[#26231F] px-4 py-2.5 text-[15px] leading-normal">
                  {mensagem.content}
                </p>
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
