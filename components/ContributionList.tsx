'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Contribution } from '@/types'

interface Props {
  contributions: Contribution[]
  currentUserId: string
  isAdmin: boolean
  isMock?: boolean
}

export function ContributionList({ contributions, currentUserId, isAdmin, isMock }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function deleteContribution(id: string) {
    setDeleting(id)
    await supabase.from('contributions').delete().eq('id', id)
    router.refresh()
    setDeleting(null)
  }

  async function confirmContribution(id: string) {
    setConfirming(id)
    const { error } = await supabase.rpc('confirm_contribution', {
      p_contribution_id: id,
    })
    if (error) console.error(error)
    router.refresh()
    setConfirming(null)
  }

  const pending = contributions.filter(c => c.status === 'pending')
  const confirmed = contributions.filter(c => c.status === 'confirmed')

  if (contributions.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        No payments yet. Be the first to add one!
      </p>
    )
  }

  const renderRow = (c: Contribution) => {
    const canDelete = !isMock && (isAdmin || c.user_id === currentUserId)
    const canConfirm = !isMock && isAdmin && c.status === 'pending'

    return (
      <div
        key={c.id}
        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {c.profile?.full_name ?? 'Unknown'}
              </p>
              {c.status === 'pending' && (
                <span className="text-xs bg-amber-900/50 border border-amber-800 text-amber-400 rounded-full px-2 py-0.5">
                  pending
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {formatDate(c.contributed_at)}
              {c.notes && <span className="ml-2 text-zinc-600">· {c.notes}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-sm font-semibold text-emerald-400">
            {formatCurrency(c.amount)}
          </span>
          {canConfirm && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-600 hover:text-emerald-400"
              onClick={() => confirmContribution(c.id)}
              disabled={confirming === c.id}
              title="Confirm payment received"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-600 hover:text-red-400"
              onClick={() => deleteContribution(c.id)}
              disabled={deleting === c.id}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          {isAdmin && (
            <p className="text-xs text-amber-400 font-medium">
              {pending.length} awaiting confirmation — click ✓ to confirm
            </p>
          )}
          {pending.map(renderRow)}
        </div>
      )}
      {confirmed.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && (
            <p className="text-xs text-zinc-500 font-medium pt-1">Confirmed</p>
          )}
          {confirmed.map(renderRow)}
        </div>
      )}
    </div>
  )
}
