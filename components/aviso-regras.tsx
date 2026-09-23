export function AvisoRegras({ ausentes }: { ausentes: string[] }) {
  if (ausentes.length === 0) return null

  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5 rounded-xl border border-[#7A3B2A] bg-[#2A1714] px-4 py-3"
    >
      <span className="text-[13px] font-semibold text-[#E08C55]">
        {ausentes.length === 1
          ? 'Uma regra inegociável sumiu do prompt:'
          : 'Regras inegociáveis sumiram do prompt:'}
      </span>
      <ul className="flex flex-col gap-1">
        {ausentes.map((regra) => (
          <li key={regra} className="text-[13px] leading-snug text-[#E0BFB2]">
            “{regra}”
          </li>
        ))}
      </ul>
      <span className="text-[13px] leading-snug text-[#E0BFB2]">
        Sem isso o bot pode começar a dar preço que ele não tem autoridade para dar.
      </span>
    </div>
  )
}
