export const COOLDOWN_MS = 60_000

export function shouldSummarize(args: {
  summaryAttemptedAt: Date | null
  summaryInputHash: string | null
  transcriptHash: string
  now: Date
  force?: boolean
}): boolean {
  if (args.summaryInputHash === args.transcriptHash) return false
  if (args.force) return true
  if (args.summaryAttemptedAt === null) return true
  return args.now.getTime() - args.summaryAttemptedAt.getTime() >= COOLDOWN_MS
}
