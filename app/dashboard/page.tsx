import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, LogIn, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { GroupWithRole } from '@/types'
import { MOCK_GROUP, MOCK_MEMBERS } from '@/lib/mock-data'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export default async function DashboardPage() {
  let groups: GroupWithRole[] = []

  if (IS_MOCK) {
    groups = [{ ...MOCK_GROUP, role: 'member', member_count: MOCK_MEMBERS.length }]
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: memberships } = await supabase
      .from('group_members')
      .select(`
        role,
        group:groups (
          id, name, loan_balance, invite_code, created_at,
          group_members(count)
        )
      `)
      .eq('user_id', user.id)

    groups = (memberships ?? []).flatMap((m) => {
      const g = m.group as any
      if (!g) return []
      return [{ ...g, role: m.role, member_count: g.group_members?.[0]?.count ?? 0 }]
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Your groups</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {groups.length === 0
              ? 'Create or join a group to get started'
              : `You're in ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/groups/join">
              <LogIn className="h-4 w-4" />
              Join
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              New group
            </Link>
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingDown className="h-12 w-12 text-zinc-700 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300">No groups yet</h2>
          <p className="text-sm text-zinc-500 mt-1 max-w-xs">
            Create a group to track your family's offset account contributions and see your interest savings.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" asChild>
              <Link href="/groups/join">
                <LogIn className="h-4 w-4" />
                Join with a code
              </Link>
            </Button>
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="h-4 w-4" />
                Create a group
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:border-zinc-700 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <Badge variant={group.role === 'admin' ? 'admin' : 'secondary'}>
                      {group.role}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created {formatDate(group.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Users className="h-3.5 w-3.5" />
                      {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </span>
                    {group.loan_balance > 0 && (
                      <span className="text-zinc-400">
                        Loan: {formatCurrency(group.loan_balance)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
