'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { generateInviteCode } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewGroupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [loanBalance, setLoanBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const rate = parseFloat(interestRate)
    if (isNaN(rate) || rate <= 0 || rate > 30) {
      setError('Please enter a valid interest rate (e.g. 6.25)')
      setLoading(false)
      return
    }

    const balance = parseFloat(loanBalance)
    if (isNaN(balance) || balance <= 0) {
      setError('Please enter a valid loan balance')
      setLoading(false)
      return
    }

    const { data: groupId, error: groupErr } = await supabase.rpc('create_group', {
      p_name: name.trim(),
      p_loan_balance: balance,
      p_invite_code: generateInviteCode(),
      p_rate: rate,
      p_effective_from: effectiveFrom,
      p_full_name: user.user_metadata?.full_name ?? user.email ?? '',
      p_email: user.email ?? '',
    })

    if (groupErr || !groupId) {
      setError(groupErr?.message ?? 'Failed to create group')
      setLoading(false)
      return
    }

    router.push(`/groups/${groupId}`)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-100">Create a group</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group details</CardTitle>
          <CardDescription>
            Set up your offset account group. You'll get an invite code to share with family.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Group name</Label>
              <Input
                id="name"
                placeholder="Dad's Offset Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="balance">Current loan balance ($)</Label>
              <Input
                id="balance"
                type="number"
                placeholder="600000"
                min="1"
                step="0.01"
                value={loanBalance}
                onChange={(e) => setLoanBalance(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-500">
                Used to show what percentage of the loan your pool covers.
              </p>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <p className="text-sm font-medium text-zinc-300">Initial interest rate</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rate">Rate (% p.a.)</Label>
                  <Input
                    id="rate"
                    type="number"
                    placeholder="6.25"
                    min="0.01"
                    max="30"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="effectiveFrom">Effective from</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create group'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
