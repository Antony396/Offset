import type { Contribution, InterestRate, SavingsSummary, MemberSavings, ContributionSavings } from '@/types'

/**
 * Australian home loan offset account interest calculation.
 *
 * Interest accrues daily: Daily interest = amount × (rate / 100 / 365)
 * The rate may change over time, so we split each contribution's lifetime
 * into periods based on the rate history and sum the savings per period.
 *
 * @param contributions  All contributions for the group
 * @param rateHistory    All interest rate records sorted by effective_from ASC
 * @param today          Reference date (defaults to now)
 */
export function calculateSavings(
  contributions: Contribution[],
  rateHistory: InterestRate[],
  today: Date = new Date()
): SavingsSummary {
  if (rateHistory.length === 0 || contributions.length === 0) {
    return {
      total_contributed: contributions.reduce((s, c) => s + c.amount, 0),
      total_saved: 0,
      savings_this_month: 0,
      daily_saving_rate: 0,
      per_member: [],
    }
  }

  // Sort rate history ascending by effective_from
  const rates = [...rateHistory].sort(
    (a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime()
  )

  // Current rate (latest in history)
  const currentRate = rates[rates.length - 1].rate

  // Start of current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  let totalSaved = 0
  let savingsThisMonth = 0
  const perMember: Record<string, MemberSavings> = {}

  for (const contribution of contributions) {
    const contribDate = new Date(contribution.contributed_at)
    if (contribDate > today) continue // future contribution — skip

    const saved = savedForContribution(contribution, rates, today)
    const savedThisMonth = savedForContribution(contribution, rates, today, monthStart)
    const contribDate = new Date(contribution.contributed_at)
    const daysInFund = Math.floor((today.getTime() - contribDate.getTime()) / (1000 * 60 * 60 * 24))

    totalSaved += saved
    savingsThisMonth += savedThisMonth

    if (!perMember[contribution.user_id]) {
      perMember[contribution.user_id] = {
        user_id: contribution.user_id,
        full_name: contribution.profile?.full_name ?? 'Unknown',
        total_contributed: 0,
        total_saved: 0,
        contributions: [],
      }
    }
    perMember[contribution.user_id].total_contributed += contribution.amount
    perMember[contribution.user_id].total_saved += saved
    perMember[contribution.user_id].contributions.push({
      id: contribution.id,
      amount: contribution.amount,
      contributed_at: contribution.contributed_at,
      days_in_fund: Math.max(0, daysInFund),
      interest_saved: saved,
      notes: contribution.notes,
    })
  }

  // Current total pool × current daily rate
  const totalPool = contributions.reduce((s, c) => s + c.amount, 0)
  const dailySavingRate = totalPool * (currentRate / 100 / 365)

  return {
    total_contributed: totalPool,
    total_saved: totalSaved,
    savings_this_month: savingsThisMonth,
    daily_saving_rate: dailySavingRate,
    per_member: Object.values(perMember),
  }
}

/**
 * Calculate interest saved by a single contribution from `fromDate` to `today`,
 * respecting each rate period in rateHistory.
 */
function savedForContribution(
  contribution: Contribution,
  rates: InterestRate[],   // sorted ASC by effective_from
  today: Date,
  fromDate?: Date
): number {
  const start = fromDate
    ? new Date(Math.max(new Date(contribution.contributed_at).getTime(), fromDate.getTime()))
    : new Date(contribution.contributed_at)

  if (start >= today) return 0

  let saved = 0

  for (let i = 0; i < rates.length; i++) {
    const rateStart = new Date(rates[i].effective_from)
    const rateEnd = rates[i + 1]
      ? new Date(rates[i + 1].effective_from)
      : today

    // Overlap between [start, today] and [rateStart, rateEnd]
    const overlapStart = new Date(Math.max(start.getTime(), rateStart.getTime()))
    const overlapEnd = new Date(Math.min(today.getTime(), rateEnd.getTime()))

    if (overlapStart < overlapEnd) {
      const days =
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
      saved += contribution.amount * (rates[i].rate / 100 / 365) * days
    }
  }

  return saved
}

/**
 * Project future savings for N years given a pool amount and a rate.
 * Useful for showing "if the pool stays at $X you'll save $Y per year".
 */
export function projectAnnualSavings(poolAmount: number, ratePercent: number): number {
  return poolAmount * (ratePercent / 100)
}
