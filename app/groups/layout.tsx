import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { MOCK_USER } from '@/lib/mock-data'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export default async function GroupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userName = ''

  if (IS_MOCK) {
    userName = MOCK_USER.full_name
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name ?? user.email ?? ''
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userName={userName} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
