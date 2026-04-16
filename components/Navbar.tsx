'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TrendingDown } from 'lucide-react'

export function Navbar({ userName }: { userName: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-zinc-100">
          <TrendingDown className="h-5 w-5 text-emerald-400" />
          OffsetPool
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 hidden sm:block">{userName}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}
