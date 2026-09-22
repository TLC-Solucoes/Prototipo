export const COOLDOWN_MS = 60_000

export function shouldSummarize(args: {
  summaryUpdatedAt: Date | null
  summaryInputHash: string | null
  transcriptHash: string
  now: Date
  force?: boolean
}): boolean {
  if (args.summaryInputHash === args.transcriptHash) return false
  if (args.force) return true
  if (args.summaryUpdatedAt === null) return true
  return args.now.getTime() - args.summaryUpdatedAt.getTime() >= COOLDOWN_MS
}
