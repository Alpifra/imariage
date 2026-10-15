import type { Photo } from '../api/types'

export interface PhotoSection {
  key: string
  title: string
  sub: string
  photos: Photo[]
}

/** A pause longer than this between two uploads starts a new moment of the day */
const GAP_MS = 45 * 60 * 1000
const RECENT_MS = 15 * 60 * 1000

const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })

function moment(date: Date): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Matinée'
  if (hour >= 12 && hour < 18) return 'Après-midi'
  if (hour >= 18) return 'Soirée'

  return 'Nuit'
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Photos are listed newest first: each section runs from its oldest to its newest photo */
export function groupByMoment(photos: Photo[], now = new Date()): PhotoSection[] {
  const groups: Photo[][] = []
  for (const photo of photos) {
    const group = groups.at(-1)
    const previous = group?.at(-1)
    if (group && previous && new Date(previous.createdAt).getTime() - new Date(photo.createdAt).getTime() < GAP_MS) {
      group.push(photo)
    } else {
      groups.push([photo])
    }
  }

  const days = new Set(photos.map((photo) => new Date(photo.createdAt).toDateString()))

  return groups.map((group, index) => {
    const newest = new Date(group[0].createdAt)
    const oldest = new Date(group[group.length - 1].createdAt)
    const live = index === 0 && now.getTime() - newest.getTime() < RECENT_MS
    const title = moment(oldest)

    return {
      key: group[0].id,
      title: days.size > 1 ? `${capitalize(weekday.format(oldest))} · ${title.toLowerCase()}` : title,
      sub: `${time.format(oldest)} – ${live ? 'maintenant' : time.format(newest)}`,
      photos: group,
    }
  })
}

const relativeDay = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
const longDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDayTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const days = Math.round((new Date(date.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86_400_000)
  const day = days >= -1 && days <= 0 ? relativeDay.format(days, 'day') : longDay.format(date)

  return `${capitalize(day)} · ${time.format(date)}`
}
