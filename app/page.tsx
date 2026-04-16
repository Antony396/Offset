import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingDown, Users, History, DollarSign } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <TrendingDown className="h-5 w-5 text-emerald-400" />
            OffsetPool
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs text-emerald-400 mb-6">
          Built for Australian home loans
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 max-w-2xl leading-tight">
          Track your family's offset account contributions
        </h1>
        <p className="mt-4 text-lg text-zinc-400 max-w-xl">
          Pool money into dad's offset account. See exactly how much interest you're saving — calculated daily, just like the bank does it.
        </p>
        <div className="flex gap-3 mt-8">
          <Button asChild size="lg">
            <Link href="/register">Create your account</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800 bg-zinc-950/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={<Users className="h-6 w-6 text-emerald-400" />}
              title="Family groups"
              description="Dad creates a group and shares an invite code. Everyone joins and logs their contributions."
            />
            <Feature
              icon={<DollarSign className="h-6 w-6 text-emerald-400" />}
              title="Daily interest savings"
              description="Interest is calculated daily just like your bank. Every dollar you add saves money from the moment it goes in."
            />
            <Feature
              icon={<History className="h-6 w-6 text-emerald-400" />}
              title="Rate history"
              description="Track every interest rate change. Savings are recalculated using the exact rate that applied each day."
            />
            <Feature
              icon={<TrendingDown className="h-6 w-6 text-emerald-400" />}
              title="See who's contributing"
              description="A breakdown of each family member's contributions and the interest they've each saved dad."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        OffsetPool — built for Australian offset account holders
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      {icon}
      <h3 className="font-semibold text-zinc-200">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
