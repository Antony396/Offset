import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { SavingsSummary as Summary } from '@/types'
import { TrendingDown, DollarSign, CalendarDays, Zap, TrendingUp } from 'lucide-react'

interface Props {
  summary: Summary
  interestRate: number
  loanBalance: number
}

export function SavingsSummary({ summary, interestRate, loanBalance }: Props) {
  const poolPercent = loanBalance > 0
    ? ((summary.total_contributed / loanBalance) * 100).toFixed(1)
    : null

  const weeklyRate = summary.daily_saving_rate * 7
  const annualRate = summary.daily_saving_rate * 365

  return (
    <div className="space-y-3">
      {/* Forward-looking highlight */}
      <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">At current pool size you're saving</p>
          <p className="text-2xl font-bold text-emerald-300">{formatCurrency(weeklyRate)}<span className="text-sm font-normal text-emerald-500 ml-1">/ week</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Projected this year</p>
          <p className="text-lg font-bold text-zinc-200">{formatCurrency(annualRate)}</p>
        </div>
      </div>

      {/* Historical stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          label="Total pool"
          value={formatCurrency(summary.total_contributed)}
          sub={poolPercent ? `${poolPercent}% of loan` : undefined}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-emerald-400" />}
          label="Interest saved"
          value={formatCurrency(summary.total_saved)}
          sub="all time"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4 text-emerald-400" />}
          label="Saved this month"
          value={formatCurrency(summary.savings_this_month)}
          sub={`at ${interestRate}% p.a.`}
        />
        <StatCard
          icon={<Zap className="h-4 w-4 text-emerald-400" />}
          label="Saving per day"
          value={formatCurrency(summary.daily_saving_rate)}
          sub="at current pool"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-xl font-bold text-zinc-100">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
