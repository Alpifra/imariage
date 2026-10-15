import { createContext, useContext } from 'react'
import type { Guest } from '../api/types'

export interface Session {
  /** undefined while the first /guests/me is in flight, null when not identified */
  guest: Guest | null | undefined
  setGuest: (guest: Guest | null) => void
  refresh: () => Promise<void>
  eventCode: string | null
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (session === null) throw new Error('useSession must be used inside SessionProvider')

  return session
}

export function initials(guest: Pick<Guest, 'firstName' | 'lastName'>): string {
  return `${guest.firstName.charAt(0)}${guest.lastName.charAt(0)}`.toUpperCase()
}
