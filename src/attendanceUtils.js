export function attendanceSummary(records) {
  const counted = records.filter(record => ['Present', 'Absent', 'Late'].includes(record.status))
  const attended = counted.filter(record => ['Present', 'Late'].includes(record.status)).length
  return { attended, total: counted.length, percentage: counted.length ? Math.round(attended / counted.length * 100) : null }
}
