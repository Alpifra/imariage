const number = new Intl.NumberFormat('fr-FR')
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const dayTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export const formatCount = (value: number) => number.format(value)

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${decimal.format(bytes / 1e9)} Go`
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} Mo`

  return `${Math.max(1, Math.round(bytes / 1e3))} Ko`
}

export const formatDateTime = (iso: string) => dayTime.format(new Date(iso))

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${formatCount(count)} ${count === 1 ? singular : pluralForm}`
