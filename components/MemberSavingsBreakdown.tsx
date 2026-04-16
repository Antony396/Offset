'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { MemberSavings } from '@/types'

interface Props {
  members: MemberSavings[]
}

export function MemberSavingsBreakdown({ members }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const sorted = [...members].sort((a, b) => b.total_saved - a.total_saved)

  if (sorted.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">No confirmed contributions yet.</p>
  }

  return (
    <div className="space-y-2">
      {sorted.map(member => {
        const isOpen = expanded === member.user_id
        const sortedContribs = [...member.contributions].sort(
          (a, b) => new Date(a.contributed_at).getTime() - new Date(b.contributed_at).getTime()
        )

        return (
          <div key={member.user_id} className="rounded-lg border border-zinc-800 overflow-hidden">
            {/* Member row */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
              onClick={() => setExpanded(isOpen ? null : member.user_id)}
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />}
                <span className="text-sm font-medium text-zinc-100">{member.full_name}</span>
                <span className="text-xs text-zinc-500">{member.contributions.length} payments</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(member.total_contributed)}</p>
                <p className="text-xs text-zinc-500">saved {formatCurrency(member.total_saved)}</p>
              </div>
            </button>

            {/* Per-contribution rows */}
            {isOpen && (
              <div className="divide-y divide-zinc-800/50">
                {sortedContribs.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/50">
                    <div>
                      <p className="text-xs text-zinc-300">
                        {formatDate(c.contributed_at)}
                        {c.notes && <span className="ml-2 text-zinc-600">· {c.notes}</span>}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {c.days_in_fund} days in fund
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-zinc-200">{formatCurrency(c.amount)}</p>
                      <p className="text-xs text-emerald-500">saved {formatCurrency(c.interest_saved)}</p>
                    </div>
                  </div>
                ))}

                {/* Member total */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Total</p>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-100">{formatCurrency(member.total_contributed)}</p>
                    <p className="text-xs font-bold text-emerald-400">saved {formatCurrency(member.total_saved)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
