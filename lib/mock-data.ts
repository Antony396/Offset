import type { Group, GroupMember, InterestRate, Contribution, Profile } from '@/types'

export const MOCK_USER: Profile = {
  id: 'mock-user-1',
  full_name: 'Anton (You)',
  email: 'anton@example.com',
  created_at: '2024-01-01T00:00:00Z',
}

export const MOCK_PROFILES: Profile[] = [
  MOCK_USER,
  { id: 'mock-user-2', full_name: 'Dad', email: 'dad@example.com', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mock-user-3', full_name: 'Brother 1', email: 'brother1@example.com', created_at: '2024-01-01T00:00:00Z' },
  { id: 'mock-user-4', full_name: 'Brother 2', email: 'brother2@example.com', created_at: '2024-01-01T00:00:00Z' },
]

export const MOCK_GROUP: Group = {
  id: 'mock-group-1',
  name: "Dad's Offset Account",
  loan_balance: 580000,
  invite_code: 'ABCD1234',
  created_by: 'mock-user-2',
  created_at: '2024-01-15T00:00:00Z',
}

export const MOCK_MEMBERS: GroupMember[] = [
  { id: 'm1', group_id: 'mock-group-1', user_id: 'mock-user-2', role: 'admin',  joined_at: '2024-01-15T00:00:00Z', profile: MOCK_PROFILES[1] },
  { id: 'm2', group_id: 'mock-group-1', user_id: 'mock-user-1', role: 'member', joined_at: '2024-01-16T00:00:00Z', profile: MOCK_PROFILES[0] },
  { id: 'm3', group_id: 'mock-group-1', user_id: 'mock-user-3', role: 'member', joined_at: '2024-01-17T00:00:00Z', profile: MOCK_PROFILES[2] },
  { id: 'm4', group_id: 'mock-group-1', user_id: 'mock-user-4', role: 'member', joined_at: '2024-01-18T00:00:00Z', profile: MOCK_PROFILES[3] },
]

// Two rate changes to show the rate-history feature
export const MOCK_RATES: InterestRate[] = [
  { id: 'r1', group_id: 'mock-group-1', rate: 6.25, effective_from: '2024-01-15', created_by: 'mock-user-2', created_at: '2024-01-15T00:00:00Z' },
  { id: 'r2', group_id: 'mock-group-1', rate: 6.49, effective_from: '2024-08-01', created_by: 'mock-user-2', created_at: '2024-08-01T00:00:00Z' },
  { id: 'r3', group_id: 'mock-group-1', rate: 6.10, effective_from: '2025-02-01', created_by: 'mock-user-2', created_at: '2025-02-01T00:00:00Z' },
]

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  // Lump sum from dad
  { id: 'c1', group_id: 'mock-group-1', user_id: 'mock-user-2', amount: 10000, contributed_at: '2024-01-20', notes: 'Initial deposit', created_at: '2024-01-20T00:00:00Z', profile: MOCK_PROFILES[1] },
  // Anton
  { id: 'c2', group_id: 'mock-group-1', user_id: 'mock-user-1', amount: 2000,  contributed_at: '2024-02-01', notes: 'Lump sum to start', created_at: '2024-02-01T00:00:00Z', profile: MOCK_PROFILES[0] },
  { id: 'c3', group_id: 'mock-group-1', user_id: 'mock-user-1', amount: 200,   contributed_at: '2024-02-07', notes: null, created_at: '2024-02-07T00:00:00Z', profile: MOCK_PROFILES[0] },
  { id: 'c4', group_id: 'mock-group-1', user_id: 'mock-user-1', amount: 200,   contributed_at: '2024-02-14', notes: null, created_at: '2024-02-14T00:00:00Z', profile: MOCK_PROFILES[0] },
  { id: 'c5', group_id: 'mock-group-1', user_id: 'mock-user-1', amount: 200,   contributed_at: '2024-02-21', notes: null, created_at: '2024-02-21T00:00:00Z', profile: MOCK_PROFILES[0] },
  // Brother 1
  { id: 'c6', group_id: 'mock-group-1', user_id: 'mock-user-3', amount: 1500,  contributed_at: '2024-02-01', notes: 'Lump sum', created_at: '2024-02-01T00:00:00Z', profile: MOCK_PROFILES[2] },
  { id: 'c7', group_id: 'mock-group-1', user_id: 'mock-user-3', amount: 150,   contributed_at: '2024-02-07', notes: null, created_at: '2024-02-07T00:00:00Z', profile: MOCK_PROFILES[2] },
  { id: 'c8', group_id: 'mock-group-1', user_id: 'mock-user-3', amount: 150,   contributed_at: '2024-02-14', notes: null, created_at: '2024-02-14T00:00:00Z', profile: MOCK_PROFILES[2] },
  // Brother 2
  { id: 'c9', group_id: 'mock-group-1', user_id: 'mock-user-4', amount: 500,   contributed_at: '2024-03-01', notes: 'First contribution', created_at: '2024-03-01T00:00:00Z', profile: MOCK_PROFILES[3] },
  { id: 'c10',group_id: 'mock-group-1', user_id: 'mock-user-4', amount: 100,   contributed_at: '2024-03-08', notes: null, created_at: '2024-03-08T00:00:00Z', profile: MOCK_PROFILES[3] },
  { id: 'c11',group_id: 'mock-group-1', user_id: 'mock-user-4', amount: 100,   contributed_at: '2024-03-15', notes: null, created_at: '2024-03-15T00:00:00Z', profile: MOCK_PROFILES[3] },
  { id: 'c12',group_id: 'mock-group-1', user_id: 'mock-user-4', amount: 100,   contributed_at: '2024-03-22', notes: null, created_at: '2024-03-22T00:00:00Z', profile: MOCK_PROFILES[3] },
]
