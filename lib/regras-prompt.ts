export const HARD_RULES = [
  'Nunca fale preço',
  'nenhum valor, nenhuma faixa',
  'uma pergunta por mensagem',
] as const

export function missingHardRules(prompt: string): string[] {
  return HARD_RULES.filter((regra) => !prompt.includes(regra))
}
