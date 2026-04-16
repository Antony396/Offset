'use client'

import { useState } from 'react'
import { formatDate, formatPercent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { InterestRate } from '@/types'

interface Props {
  rates: InterestRate[]
  isAdmin: boolean
  isMock?: boolean
}

export function RateHistoryList({ rates, isAdmin, isMock }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  const sorted = [...rates].sort(
    (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  )

  async function deleteRate(id: string) {
    setDeleting(id)
    await supabase.from('interest_rates').delete().eq('id', id)
    router.refresh()
    setDeleting(null)
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-zinc-500 py-3 text-center">No rates set yet.</p>
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((r, i) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5"
        >
          <div>
            <span className="text-sm font-semibold text-zinc-100">{formatPercent(r.rate)}</span>
            {i === 0 && (
              <span className="ml-2 text-xs bg-emerald-900 text-emerald-300 rounded-full px-2 py-0.5">
                Current
              </span>
            )}
            <p className="text-xs text-zinc-500">From {formatDate(r.effective_from)}</p>
          </div>
          {isAdmin && !isMock && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-600 hover:text-red-400"
              onClick={() => deleteRate(r.id)}
              disabled={deleting === r.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
