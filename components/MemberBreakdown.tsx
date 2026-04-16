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
    <div className="space-y-3">
      {sorted.map((m) => {
        const pct = totalContributed > 0
          ? Math.round((m.total_contributed / totalContributed) * 100)
          : 0

        const annualSaving = m.total_contributed * (interestRate / 100)

        return (
          <div key={m.user_id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-200 font-medium">{m.full_name}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(m.total_contributed)}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <p className="text-xs text-zinc-600">{pct}% of pool</p>
              <p className="text-xs text-zinc-500">
                saves <span className="text-emerald-500">{formatCurrency(annualSaving)}</span>/yr
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
