import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { Guest } from '../api/types'
import { SessionContext } from './session'

const EVENT_CODE_KEY = 'imariage.eventCode'

function readEventCode(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('code')
  if (fromUrl) {
    sessionStorage.setItem(EVENT_CODE_KEY, fromUrl)
    return fromUrl
  }

  return sessionStorage.getItem(EVENT_CODE_KEY)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<Guest | null | undefined>(undefined)
  const [eventCode] = useState(readEventCode)

  const refresh = useCallback(async () => {
    try {
      setGuest(await api.me())
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setGuest(null)
      } else {
        throw error
      }
    }
  }, [])

  useEffect(() => {
    api.me().then(setGuest, () => setGuest(null))
  }, [])

  const value = useMemo(() => ({ guest, setGuest, refresh, eventCode }), [guest, refresh, eventCode])

  return <SessionContext value={value}>{children}</SessionContext>
}
