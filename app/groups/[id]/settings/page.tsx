'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RateHistoryList } from '@/components/RateHistoryList'
import { ArrowLeft, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { InterestRate, GroupMember } from '@/types'
import { use } from 'react'

export default function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [group, setGroup] = useState<{ name: string; loan_balance: number } | null>(null)
  const [rates, setRates] = useState<InterestRate[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Form state — loan balance
  const [loanBalance, setLoanBalance] = useState('')
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceMsg, setBalanceMsg] = useState<string | null>(null)

  // Form state — new rate
  const [newRate, setNewRate] = useState('')
  const [newRateDate, setNewRateDate] = useState(new Date().toISOString().split('T')[0])
  const [rateLoading, setRateLoading] = useState(false)
  const [rateMsg, setRateMsg] = useState<string | null>(null)

  const [removingMember, setRemovingMember] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUserId(user.id)

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      router.push(`/groups/${id}`)
      return
    }
    setIsAdmin(true)

    const [{ data: g }, { data: r }, { data: m }] = await Promise.all([
      supabase.from('groups').select('name, loan_balance').eq('id', id).single(),
      supabase.from('interest_rates').select('*').eq('group_id', id).order('effective_from'),
      supabase
        .from('group_members')
        .select('*, profile:profiles(id, full_name, email)')
        .eq('group_id', id),
    ])

    if (g) {
      setGroup(g)
      setLoanBalance(g.loan_balance.toString())
    }
    setRates(r ?? [])
    setMembers((m ?? []) as GroupMember[])
  }, [id, router, supabase])

  useEffect(() => { load() }, [load])

  async function updateBalance(e: React.FormEvent) {
    e.preventDefault()
    setBalanceLoading(true)
    setBalanceMsg(null)
    const balance = parseFloat(loanBalance)
    if (isNaN(balance) || balance <= 0) {
      setBalanceMsg('Enter a valid balance')
      setBalanceLoading(false)
      return
    }
    const { error } = await supabase
      .from('groups')
      .update({ loan_balance: balance })
      .eq('id', id)
    setBalanceMsg(error ? error.message : 'Saved!')
    setBalanceLoading(false)
  }

  async function addRate(e: React.FormEvent) {
    e.preventDefault()
    setRateLoading(true)
    setRateMsg(null)
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate <= 0 || rate > 30) {
      setRateMsg('Enter a valid rate (e.g. 6.25)')
      setRateLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('interest_rates').insert({
      group_id: id,
      rate,
      effective_from: newRateDate,
      created_by: user.id,
    })
    if (error) {
      setRateMsg(error.message)
    } else {
      setRateMsg('Rate added!')
      setNewRate('')
      await load()
    }
    setRateLoading(false)
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (memberUserId === currentUserId) return // can't remove yourself
    setRemovingMember(memberId)
    await supabase.from('group_members').delete().eq('id', memberId)
    await load()
    setRemovingMember(null)
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/groups/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-100">Group settings</h1>
      </div>

      {/* Loan balance */}
      <Card>
        <CardHeader>
          <CardTitle>Loan balance</CardTitle>
          <CardDescription>
            Update dad's current outstanding loan balance. This is used to show what percentage your pool covers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateBalance} className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="loanBalance" className="sr-only">Loan balance</Label>
              <Input
                id="loanBalance"
                type="number"
                step="0.01"
                min="1"
                value={loanBalance}
                onChange={(e) => setLoanBalance(e.target.value)}
                placeholder="600000"
              />
            </div>
            <Button type="submit" disabled={balanceLoading}>
              {balanceLoading ? 'Saving…' : 'Update'}
            </Button>
          </form>
          {balanceMsg && (
            <p className={`text-sm mt-2 ${balanceMsg === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
              {balanceMsg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Interest rate */}
      <Card>
        <CardHeader>
          <CardTitle>Add new interest rate</CardTitle>
          <CardDescription>
            When the bank changes the rate, add the new one here with the date it took effect.
            All past savings are recalculated using the correct rate for each period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addRate} className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="newRate">New rate (% p.a.)</Label>
              <Input
                id="newRate"
                type="number"
                step="0.01"
                min="0.01"
                max="30"
                placeholder="6.50"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newRateDate">Effective from</Label>
              <Input
                id="newRateDate"
                type="date"
                value={newRateDate}
                onChange={(e) => setNewRateDate(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={rateLoading} className="col-span-2">
              {rateLoading ? 'Adding…' : 'Add rate'}
            </Button>
          </form>
          {rateMsg && (
            <p className={`text-sm ${rateMsg === 'Rate added!' ? 'text-emerald-400' : 'text-red-400'}`}>
              {rateMsg}
            </p>
          )}

          <div className="pt-2">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wide font-medium">Rate history</p>
            <RateHistoryList rates={rates} isAdmin={isAdmin} />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Invite code: <span className="font-mono font-bold text-emerald-400 tracking-widest">
              {/* loaded from parent, show placeholder */}
              share from the group page
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-zinc-200">{m.profile?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-zinc-500">{m.profile?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === 'admin'
                      ? 'bg-amber-900 text-amber-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {m.role}
                  </span>
                  {m.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-600 hover:text-red-400"
                      onClick={() => removeMember(m.id, m.user_id)}
                      disabled={removingMember === m.id}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
