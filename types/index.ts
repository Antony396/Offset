export type Role = 'admin' | 'member'

export interface Profile {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  loan_balance: number
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: Role
  joined_at: string
  profile?: Profile
}

export interface InterestRate {
  id: string
  group_id: string
  rate: number          // e.g. 6.25 = 6.25% p.a.
  effective_from: string // ISO date string
  created_by: string
  created_at: string
}

export interface Contribution {
  id: string
  group_id: string
  user_id: string
  amount: number
  contributed_at: string // ISO date string
  notes: string | null
  status: 'pending' | 'confirmed'
  confirmed_at: string | null
  confirmed_by: string | null
  created_at: string
  profile?: Profile
}

export interface GroupWithRole extends Group {
  role: Role
  member_count: number
}

export interface SavingsSummary {
  total_contributed: number
  total_saved: number
  savings_this_month: number
  daily_saving_rate: number  // current daily saving $ amount
  per_member: MemberSavings[]
}

export interface MemberSavings {
  user_id: string
  full_name: string
  total_contributed: number
  total_saved: number
  contributions: ContributionSavings[]
}

export interface ContributionSavings {
  id: string
  amount: number
  contributed_at: string
  days_in_fund: number
  interest_saved: number
  notes: string | null
}
