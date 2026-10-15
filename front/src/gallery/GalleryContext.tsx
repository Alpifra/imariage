import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Album, Photo } from '../api/types'
import { PAGE_SIZE, POLLING_INTERVAL_MS } from '../config'
import { useSession } from '../session/session'
import { useUploads } from '../upload/uploads'
import { GalleryContext, type Gallery, type GalleryFilter } from './gallery'

const FAST_POLLING_INTERVAL_MS = 4_000
/** Thumbnails are usually ready within seconds; past this, a failed processing must not keep the fast pace */
const PROCESSING_WAIT_MS = 2 * 60 * 1000

function merge(newer: Photo[], older: Photo[]): Photo[] {
  const ids = new Set(newer.map((photo) => photo.id))

  return [...newer, ...older.filter((photo) => !ids.has(photo.id))]
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const { guest } = useSession()
  const uploads = useUploads()
  const [filter, setFilterState] = useState<GalleryFilter>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [pending, setPending] = useState<Photo[]>([])
  const [album, setAlbum] = useState<Album | null>(null)
  const [settledKey, setSettledKey] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)
  const [generation, setGeneration] = useState(0)
  const newest = useRef<string | undefined>(undefined)

  const loadAlbum = useCallback(() => {
    api.album().then(setAlbum).catch(() => undefined)
  }, [])

  const requestKey = `${guest?.id}|${filter.mine ?? ''}|${filter.author ?? ''}|${generation}`
  const loading = settledKey !== requestKey

  useEffect(() => {
    if (!guest) return

    let cancelled = false
    api.photos(filter)
      .then((page) => {
        if (cancelled) return
        setPhotos(page)
        setPending([])
        setHasMore(page.length === PAGE_SIZE)
        setError(false)
        newest.current = page[0]?.id
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setSettledKey(requestKey))
    loadAlbum()

    return () => {
      cancelled = true
    }
  }, [guest, filter, requestKey, loadAlbum])

  const loadMore = useCallback(() => {
    const last = photos.at(-1)
    if (loadingMore || !hasMore || !last) return

    setLoadingMore(true)
    setError(false)
    api.photos({ ...filter, before: last.id })
      .then((page) => {
        setPhotos((current) => [...current, ...page.filter((photo) => !current.some((known) => known.id === photo.id))])
        setHasMore(page.length === PAGE_SIZE)
      })
      .catch(() => setError(true))
      .finally(() => setLoadingMore(false))
  }, [photos, filter, hasMore, loadingMore])

  const [removed, setRemoved] = useState<string[]>([])
  const showsOwnPhotos = !filter.author || filter.author === guest?.id
  const lastAwaitedAt = showsOwnPhotos
    ? Math.max(0, ...uploads.uploaded
      .filter(({ photoId }) => !removed.includes(photoId) && !photos.some((photo) => photo.id === photoId) && !pending.some((photo) => photo.id === photoId))
      .map(({ at }) => at))
    : 0

  useEffect(() => {
    if (!guest || loading) return

    const poll = () => {
      if (document.hidden) return
      api.photos({ ...filter, after: newest.current })
        .then((fresh) => {
          if (fresh.length === 0) return
          // A full page means the gap may be wider: start over rather than leave a hole
          if (fresh.length === PAGE_SIZE) {
            setGeneration((value) => value + 1)
            return
          }
          newest.current = fresh[0].id
          // At the top of the list, or for the guest's own uploads, show them straight away
          if (window.scrollY < 80 || fresh.every((photo) => photo.mine)) {
            setPhotos((current) => merge(fresh, current))
          } else {
            setPending((current) => merge(fresh, current))
          }
          loadAlbum()
        })
        .catch(() => undefined)
    }

    let timeout = 0
    const schedule = () => {
      const fast = Date.now() - lastAwaitedAt < PROCESSING_WAIT_MS
      timeout = window.setTimeout(() => {
        poll()
        schedule()
      }, fast ? FAST_POLLING_INTERVAL_MS : POLLING_INTERVAL_MS)
    }
    schedule()
    document.addEventListener('visibilitychange', poll)

    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [guest, filter, loading, lastAwaitedAt, loadAlbum])

  const showPending = useCallback(() => {
    setPhotos((current) => merge(pending, current))
    setPending([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pending])

  const remove = useCallback((ids: string[]) => {
    setRemoved((current) => [...current, ...ids])
    setPhotos((current) => current.filter((photo) => !ids.includes(photo.id)))
    setPending((current) => current.filter((photo) => !ids.includes(photo.id)))
    loadAlbum()
  }, [loadAlbum])

  const setFilter = useCallback((next: GalleryFilter) => {
    setFilterState((current) => (current.mine === next.mine && current.author === next.author ? current : next))
  }, [])

  const reload = useCallback(() => setGeneration((value) => value + 1), [])

  const retry = useCallback(() => {
    if (photos.length === 0) reload()
    else loadMore()
  }, [photos.length, reload, loadMore])

  const value = useMemo(
    (): Gallery => ({ filter, setFilter, photos, album, loading, loadingMore, hasMore, error: error && !loading, pending, loadMore, retry, showPending, remove, reload }),
    [filter, setFilter, photos, album, loading, loadingMore, hasMore, error, pending, loadMore, retry, showPending, remove, reload],
  )

  return <GalleryContext value={value}>{children}</GalleryContext>
}
