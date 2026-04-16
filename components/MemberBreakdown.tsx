import { formatCurrency } from '@/lib/utils'
import type { MemberSavings } from '@/types'

interface Props {
  members: MemberSavings[]
  totalContributed: number
  interestRate: number
}

export function MemberBreakdown({ members, totalContributed, interestRate }: Props) {
  const sorted = [...members].sort((a, b) => b.total_contributed - a.total_contributed)

  if (sorted.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">No contributions yet.</p>
  }

  return (
    <div className="space-y-4">
      {sorted.map((m) => {
        const pct = totalContributed > 0
          ? Math.round((m.total_contributed / totalContributed) * 100)
          : 0
        const nextWeek = m.total_contributed * (interestRate / 100 / 52)

        return (
          <div key={m.user_id}>
            <div className="flex items-start justify-between mb-1.5">
              <span className="text-sm text-zinc-200 font-medium">{m.full_name}</span>
              <div className="text-right">
                <p className="text-xs text-zinc-500">
                  saved <span className="text-emerald-400 font-semibold">{formatCurrency(m.total_saved)}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  next week <span className="text-emerald-300 font-semibold">{formatCurrency(nextWeek)}</span>
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              {formatCurrency(m.total_contributed)} · {pct}% of pool
            </p>
          </div>
        )
      })}
    </div>
  )
}
