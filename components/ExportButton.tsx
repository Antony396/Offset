'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { Contribution } from '@/types'

interface Props {
  contributions: Contribution[]
  groupName: string
}

export function ExportButton({ contributions, groupName }: Props) {
  function handleExport() {
    const confirmed = contributions.filter(c => c.status === 'confirmed')

    const rows = [
      ['Member', 'Date', 'Amount ($)', 'Notes', 'Confirmed At'],
      ...confirmed.map(c => [
        c.profile?.full_name ?? 'Unknown',
        c.contributed_at,
        c.amount.toFixed(2),
        c.notes ?? '',
        c.confirmed_at ? new Date(c.confirmed_at).toLocaleDateString('en-AU') : '',
      ]),
    ]

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${groupName.replace(/[^a-z0-9]/gi, '_')}_payments.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  )
}
