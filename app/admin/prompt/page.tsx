import Link from 'next/link'
import { BotaoRestaurar } from '@/components/botao-restaurar'
import { EditorPrompt } from '@/components/editor-prompt'
import { ProporPrompt } from '@/components/propor-prompt'
import { listPromptVersions } from '@/lib/db'
import { SYSTEM_PADRAO } from '@/lib/prompt'

export const dynamic = 'force-dynamic'

const formatador = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function PaginaPrompt() {
  const versoes = await listPromptVersions(50)
  const atual = versoes[0]?.conteudo ?? SYSTEM_PADRAO

  return (
    <div className="min-h-dvh px-5 py-6 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2722] pb-5">
        <div className="flex flex-wrap items-baseline gap-4">
          <Link href="/admin" className="text-[14px] font-semibold text-[#A19A8E]">
            ← Conversas
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-[27px] font-semibold tracking-tight">
            Prompt do consultor
          </h1>
        </div>
        <span className="text-[13px] text-[#6F6A62]">
          {versoes.length === 0
            ? 'nenhuma versão salva: vale o prompt que vem no código'
            : `${versoes.length} ${versoes.length === 1 ? 'versão salva' : 'versões salvas'}`}
        </span>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_452px]">
        <div className="flex flex-col gap-8">
          <EditorPrompt key={versoes[0]?.id ?? 'padrao'} inicial={atual} />
          <ProporPrompt atual={atual} />
        </div>

        <aside className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]">
            Histórico
          </h2>

          {versoes.length === 0 ? (
            <p className="text-[15px] text-[#6F6A62]">
              Ainda não há versão salva. O bot está usando o prompt que vem no
              código.
            </p>
          ) : (
            <ul className="flex flex-col">
              {versoes.map((versao, indice) => (
                <li
                  key={versao.id}
                  className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-[#211F1B] py-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[14px] text-[#A19A8E]">
                        {formatador.format(versao.criadoEm)}
                      </span>
                      <span
                        className={
                          versao.origem === 'ia'
                            ? 'rounded-full border border-[#5C4228] bg-[#2A2018] px-2.5 py-1 text-[12px] font-semibold text-[#E5924F]'
                            : 'rounded-full border border-[#383430] bg-[#1F1D19] px-2.5 py-1 text-[12px] font-semibold text-[#A19A8E]'
                        }
                      >
                        {versao.origem === 'ia' ? 'IA' : 'Manual'}
                      </span>
                      {indice === 0 ? (
                        <em className="not-italic text-[12px] font-semibold text-[#C9C2B6]">
                          em uso
                        </em>
                      ) : null}
                    </span>
                    {versao.pedido ? (
                      <span className="text-[13px] leading-snug text-[#C9C2B6]">
                        “{versao.pedido}”
                      </span>
                    ) : null}
                  </div>
                  {indice === 0 ? null : <BotaoRestaurar id={versao.id} />}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
