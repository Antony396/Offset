import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SavingsSummary } from '@/components/SavingsSummary'
import { ContributionList } from '@/components/ContributionList'
import { MemberBreakdown } from '@/components/MemberBreakdown'
import { RateHistoryList } from '@/components/RateHistoryList'
import { calculateSavings } from '@/lib/calculations'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Plus, Settings } from 'lucide-react'
import type { Contribution, InterestRate, GroupMember } from '@/types'
import { CopyInviteButton } from './CopyInviteButton'
import { ExportButton } from '@/components/ExportButton'
import {
  MOCK_USER, MOCK_GROUP, MOCK_MEMBERS, MOCK_RATES, MOCK_CONTRIBUTIONS,
} from '@/lib/mock-data'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let group: typeof MOCK_GROUP
  let isAdmin: boolean
  let currentUserId: string
  let rates: InterestRate[]
  let contributions: Contribution[]
  let members: GroupMember[]

  if (IS_MOCK) {
    group = MOCK_GROUP
    isAdmin = false   // show the member view; flip to true to test admin UI
    currentUserId = MOCK_USER.id
    rates = MOCK_RATES
    contributions = [...MOCK_CONTRIBUTIONS].sort(
      (a, b) => new Date(b.contributed_at).getTime() - new Date(a.contributed_at).getTime()
    )
    members = MOCK_MEMBERS
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    currentUserId = user.id

    const [{ data: g }, { data: membership }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).single(),
      supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single(),
    ])

    if (!g || !membership) notFound()
    group = g
    isAdmin = membership.role === 'admin'

    const [{ data: ratesRaw }, { data: contributionsRaw }, { data: membersRaw }] =
      await Promise.all([
        supabase
          .from('interest_rates')
          .select('*')
          .eq('group_id', id)
          .order('effective_from', { ascending: true }),
        supabase
          .from('contributions')
          .select('*, profile:profiles(id, full_name, email)')
          .eq('group_id', id)
          .order('contributed_at', { ascending: false }),
        supabase
          .from('group_members')
          .select('*, profile:profiles(id, full_name, email)')
          .eq('group_id', id),
      ])

    rates = ratesRaw ?? []
    contributions = (contributionsRaw ?? []) as Contribution[]
    members = (membersRaw ?? []) as GroupMember[]
  }

  const currentRate = rates.length > 0 ? rates[rates.length - 1].rate : 0
  const confirmedContributions = contributions.filter(c => c.status === 'confirmed')
  const summary = calculateSavings(confirmedContributions, rates)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-zinc-100">{group.name}</h1>
            <Badge variant={isAdmin ? 'admin' : 'secondary'}>
              {isAdmin ? 'admin' : 'member'}
            </Badge>
            {IS_MOCK && (
              <span className="text-xs bg-amber-900/50 border border-amber-800 text-amber-400 rounded-full px-2 py-0.5">
                mock data
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            {group.loan_balance > 0 && (
              <p className="text-sm text-zinc-400">
                Loan balance:{' '}
                <span className="text-zinc-200 font-medium">{formatCurrency(group.loan_balance)}</span>
              </p>
            )}
            {currentRate > 0 && (
              <p className="text-sm text-zinc-400">
                Rate:{' '}
                <span className="text-zinc-200 font-medium">{formatPercent(currentRate)}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && (
            <ExportButton contributions={contributions} groupName={group.name} />
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/groups/${id}/settings`}>
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`/groups/${id}/contribute`}>
              <Plus className="h-4 w-4" />
              Add payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Invite code (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">Invite code — share this with family</p>
            <p className="text-lg font-mono font-bold tracking-widest text-emerald-400">
              {group.invite_code}
            </p>
          </div>
          <CopyInviteButton code={group.invite_code} />
        </div>
      )}

      {/* Savings summary */}
      {rates.length > 0 ? (
        <SavingsSummary
          summary={summary}
          interestRate={currentRate}
          loanBalance={group.loan_balance}
        />
      ) : (
        <div className="rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          No interest rate set yet.
          {isAdmin && (
            <Link href={`/groups/${id}/settings`} className="ml-1 underline">
              Add one in settings.
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contributions (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payment history</CardTitle>
              <span className="text-xs text-zinc-500">{contributions.length} entries</span>
            </div>
          </CardHeader>
          <CardContent>
            <ContributionList
              contributions={contributions}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              isMock={IS_MOCK}
            />
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Member breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contributions by member</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberBreakdown
                members={summary.per_member}
                totalContributed={summary.total_contributed}
                interestRate={currentRate}
              />
            </CardContent>
          </Card>

          {/* Rate history */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Interest rate history</CardTitle>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/groups/${id}/settings`}>Edit</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <RateHistoryList rates={rates} isAdmin={isAdmin} isMock={IS_MOCK} />
            </CardContent>
          </Card>

          {/* Members list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-200">{m.profile?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{m.profile?.email}</p>
                    </div>
                    <Badge variant={m.role === 'admin' ? 'admin' : 'secondary'} className="text-xs">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
