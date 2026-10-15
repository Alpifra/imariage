import { useOutletContext } from 'react-router'
import type { Guest } from '../api/types'

export interface AdminContext {
  /** Guests who shared at least one photo, most active first */
  guests: Guest[]
  reloadGuests: () => void
}

export const useAdmin = () => useOutletContext<AdminContext>()

export const GUEST_PARAM = 'invite'
