import Link from 'next/link'
import { BotaoApagar } from '@/components/botao-apagar'
import { BotaoResumo } from '@/components/botao-resumo'
import { listConversations } from '@/lib/db'

export const dynamic = 'force-dynamic'

const formatador = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function Painel() {
  const conversas = await listConversations(100)
  const comContato = conversas.filter((c) => c.status === 'com_contato').length
  const semResumo = conversas.filter((c) => !c.temResumo).length

  return (
    <div className="min-h-dvh px-5 py-7 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[#2A2722] pb-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]">
            TLC Soluções
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[30px] font-semibold tracking-tight">
            Conversas
          </h1>
        </div>
        <div className="flex items-end gap-8">
          <Link
            href="/admin/prompt"
            className="text-[14px] font-semibold text-[#E08C55]"
          >
            Prompt
          </Link>
          <dl className="flex gap-8">
            <div className="flex flex-col items-end gap-0.5">
              <dd className="font-[family-name:var(--font-display)] text-[27px] font-semibold">
                {conversas.length}
              </dd>
              <dt className="text-[12px] text-[#A19A8E]">conversas</dt>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <dd className="font-[family-name:var(--font-display)] text-[27px] font-semibold text-[#E5924F]">
                {comContato}
              </dd>
              <dt className="text-[12px] text-[#A19A8E]">com contato</dt>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <dd className="font-[family-name:var(--font-display)] text-[27px] font-semibold">
                {semResumo}
              </dd>
              <dt className="text-[12px] text-[#A19A8E]">sem resumo</dt>
            </div>
          </dl>
        </div>
      </header>

      <ul className="mt-2">
        {conversas.map((conversa) => (
          <li
            key={conversa.id}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#211F1B] px-3 py-4"
          >
            <span className="w-[110px] shrink-0 text-[14px] text-[#A19A8E]">
              {formatador.format(conversa.createdAt)}
            </span>
            <span className="w-[160px] shrink-0 text-[15px] font-semibold">
              {conversa.contactName ?? '—'}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-[15px] text-[#E6E1D8]">
              {conversa.temResumo ? (
                <span className="min-w-0 truncate">{conversa.dorPrincipal ?? '—'}</span>
              ) : (
                <em className="not-italic text-[#6F6A62]">sem resumo</em>
              )}
              {conversa.desatualizado ? (
                <>
                  {conversa.temResumo ? (
                    <em className="shrink-0 not-italic text-[#6F6A62]">desatualizado</em>
                  ) : null}
                  <BotaoResumo
                    id={conversa.id}
                    rotulo={conversa.temResumo ? 'Atualizar' : 'Gerar resumo'}
                  />
                </>
              ) : null}
            </span>
            <span className="w-10 shrink-0 text-right text-[14px] text-[#A19A8E]">
              {conversa.messageCount}
            </span>
            <span
              className={
                conversa.status === 'com_contato'
                  ? 'shrink-0 rounded-full border border-[#5C4228] bg-[#2A2018] px-2.5 py-1 text-[12px] font-semibold text-[#E5924F]'
                  : 'shrink-0 rounded-full border border-[#383430] bg-[#1F1D19] px-2.5 py-1 text-[12px] font-semibold text-[#A19A8E]'
              }
            >
              {conversa.status === 'com_contato' ? 'Com contato' : 'Aberta'}
            </span>
            <Link
              href={`/admin/${conversa.id}`}
              className="shrink-0 text-[14px] font-semibold text-[#E08C55]"
            >
              Abrir
            </Link>
            <BotaoApagar
              id={conversa.id}
              nome={conversa.contactName}
              segmento={conversa.segmento}
              mensagens={conversa.messageCount}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
