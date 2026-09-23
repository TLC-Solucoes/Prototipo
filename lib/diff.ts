export type DiffLine = {
  kind: 'equal' | 'added' | 'removed'
  text: string
}

function lcsTable(antes: string[], depois: string[]): number[][] {
  const tabela: number[][] = Array.from({ length: antes.length + 1 }, () =>
    new Array<number>(depois.length + 1).fill(0),
  )

  for (let i = antes.length - 1; i >= 0; i--) {
    for (let j = depois.length - 1; j >= 0; j--) {
      tabela[i][j] =
        antes[i] === depois[j]
          ? tabela[i + 1][j + 1] + 1
          : Math.max(tabela[i + 1][j], tabela[i][j + 1])
    }
  }

  return tabela
}

export function diffLines(before: string, after: string): DiffLine[] {
  const antes = before.split('\n')
  const depois = after.split('\n')
  const tabela = lcsTable(antes, depois)
  const linhas: DiffLine[] = []

  let i = 0
  let j = 0
  while (i < antes.length && j < depois.length) {
    if (antes[i] === depois[j]) {
      linhas.push({ kind: 'equal', text: antes[i] })
      i++
      j++
    } else if (tabela[i + 1][j] >= tabela[i][j + 1]) {
      linhas.push({ kind: 'removed', text: antes[i] })
      i++
    } else {
      linhas.push({ kind: 'added', text: depois[j] })
      j++
    }
  }
  while (i < antes.length) linhas.push({ kind: 'removed', text: antes[i++] })
  while (j < depois.length) linhas.push({ kind: 'added', text: depois[j++] })

  return linhas
}
