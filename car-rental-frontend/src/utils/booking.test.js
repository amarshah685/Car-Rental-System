import { describe, it, expect } from 'vitest'
import { calculateDays, calculateTotalPrice, isValidDateRange } from './booking'

describe('calculateDays', () => {
  it('returns 0 when dates are missing', () => {
    expect(calculateDays('', '')).toBe(0)
    expect(calculateDays('2026-10-01', '')).toBe(0)
  })

  it('calculates the correct number of days between two dates', () => {
    expect(calculateDays('2026-10-01', '2026-10-05')).toBe(4)
  })

  it('returns 0 for a same-day range', () => {
    expect(calculateDays('2026-10-01', '2026-10-01')).toBe(0)
  })

  it('never returns a negative number, even if end is before start', () => {
    expect(calculateDays('2026-10-05', '2026-10-01')).toBe(0)
  })
})

describe('calculateTotalPrice', () => {
  it('multiplies days by daily rate', () => {
    expect(calculateTotalPrice('2026-10-01', '2026-10-05', 100)).toBe(400)
  })

  it('returns 0 when the date range is invalid', () => {
    expect(calculateTotalPrice('', '', 100)).toBe(0)
  })
})

describe('isValidDateRange', () => {
  it('returns false when either date is missing', () => {
    expect(isValidDateRange('', '2026-10-05')).toBe(false)
    expect(isValidDateRange('2026-10-01', '')).toBe(false)
  })

  it('returns true when end date is after start date', () => {
    expect(isValidDateRange('2026-10-01', '2026-10-05')).toBe(true)
  })

  it('returns false when end date equals start date', () => {
    expect(isValidDateRange('2026-10-01', '2026-10-01')).toBe(false)
  })

  it('returns false when end date is before start date', () => {
    expect(isValidDateRange('2026-10-05', '2026-10-01')).toBe(false)
  })
})