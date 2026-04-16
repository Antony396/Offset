'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function JoinGroupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: groupId, error: joinErr } = await supabase.rpc('join_group', {
      p_invite_code: code.trim(),
      p_full_name: user.user_metadata?.full_name ?? user.email ?? '',
      p_email: user.email ?? '',
    })

    if (joinErr) {
      setError(joinErr.message === 'Invalid invite code'
        ? 'Invalid invite code. Please check with the group owner.'
        : joinErr.message)
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
        <h1 className="text-xl font-bold text-zinc-100">Join a group</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter invite code</CardTitle>
          <CardDescription>
            Ask the group admin for their 8-character invite code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                placeholder="e.g. AB12CD34"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                required
                className="uppercase tracking-widest text-center text-lg font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading ? 'Joining…' : 'Join group'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
