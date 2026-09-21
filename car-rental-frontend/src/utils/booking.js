export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  return Math.max(0, diff)
}

export function calculateTotalPrice(startDate, endDate, dailyRate) {
  const days = calculateDays(startDate, endDate)
  return days * dailyRate
}

export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false
  return new Date(endDate) > new Date(startDate)
}