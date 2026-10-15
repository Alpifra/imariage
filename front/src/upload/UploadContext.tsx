import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError, uploadPhoto, type UploadHandle } from '../api/client'
import { useOnline } from '../session/useOnline'
import { UploadContext, type UploadItem, type Uploads } from './uploads'

const CONCURRENCY = 2
const MAX_RETRY_DELAY_MS = 30_000

/** Rejections the server will repeat on every attempt: the guest has to act */
function isFinal(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429
}

function failureMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 413) return 'La photo dépasse la taille maximale de 25 Mo.'
  if (error instanceof ApiError && error.status === 401) return 'Session expirée, rechargez la page.'
  if (error instanceof ApiError && error.detail) return error.detail

  return 'Échec de l’envoi'
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [tick, setTick] = useState(0)
  const [uploaded, setUploaded] = useState<Uploads['uploaded']>([])
  const online = useOnline()
  const handles = useRef(new Map<string, UploadHandle>())

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const start = useCallback((item: UploadItem) => {
    const handle = uploadPhoto(item.file, (ratio) => update(item.id, { progress: ratio }))
    handles.current.set(item.id, handle)

    handle.promise
      .then((photo) => {
        update(item.id, { status: 'done', progress: 1, photoId: photo.id })
        setUploaded((current) => [...current, { photoId: photo.id, at: Date.now() }])
      })
      .catch((error: unknown) => {
        if (isFinal(error)) {
          update(item.id, { status: 'failed', error: failureMessage(error) })
          return
        }
        const attempts = item.attempts + 1
        const delay = Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** attempts)
        update(item.id, { status: 'waiting', progress: 0, attempts, retryAt: Date.now() + delay })
        window.setTimeout(() => setTick((value) => value + 1), delay)
      })
      .finally(() => handles.current.delete(item.id))
  }, [update])

  useEffect(() => {
    if (!online) return

    const now = Date.now()
    const free = CONCURRENCY - items.filter((item) => item.status === 'uploading').length
    const next = items.filter((item) => item.status === 'waiting' && item.retryAt <= now && !handles.current.has(item.id)).slice(0, Math.max(0, free))
    if (next.length === 0) return

    const ids = new Set(next.map((item) => item.id))
    setItems((current) => current.map((item) => (ids.has(item.id) ? { ...item, status: 'uploading', progress: 0 } : item)))
    next.forEach(start)
  }, [items, online, tick, start])

  // Coming back online: retry right away instead of waiting for the backoff
  useEffect(() => {
    const resume = () => setItems((current) => current.map((item) => (item.status === 'waiting' ? { ...item, retryAt: 0 } : item)))
    window.addEventListener('online', resume)

    return () => window.removeEventListener('online', resume)
  }, [])

  const add = useCallback((files: FileList | File[]) => {
    const added = Array.from(files).map((file): UploadItem => ({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^.]+$/, ''),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'waiting',
      progress: 0,
      attempts: 0,
      retryAt: 0,
    }))
    setItems((current) => {
      // A new batch after a finished one restarts the "3 / 8" counter
      const idle = !current.some((item) => item.status === 'waiting' || item.status === 'uploading')
      const kept = idle ? current.filter((item) => item.status !== 'done') : current
      current.filter((item) => !kept.includes(item)).forEach((item) => URL.revokeObjectURL(item.previewUrl))

      return [...kept, ...added]
    })
  }, [])

  const retry = useCallback((id: string) => update(id, { status: 'waiting', retryAt: 0, error: undefined }), [update])

  const retryFailed = useCallback(() => {
    setItems((current) => current.map((item) => (item.status === 'failed' ? { ...item, status: 'waiting', retryAt: 0, error: undefined } : item)))
  }, [])

  const clear = useCallback(() => {
    setItems((current) => {
      const kept = current.filter((item) => item.status === 'waiting' || item.status === 'uploading')
      current.filter((item) => !kept.includes(item)).forEach((item) => URL.revokeObjectURL(item.previewUrl))

      return kept
    })
  }, [])

  const value = useMemo((): Uploads => {
    const sent = items.filter((item) => item.status === 'done').length
    const failedCount = items.filter((item) => item.status === 'failed').length
    const pending = items.some((item) => item.status === 'waiting' || item.status === 'uploading')

    return {
      items,
      sent,
      total: items.length,
      paused: !online && pending,
      finished: items.length > 0 && !pending,
      failedCount,
      uploaded,
      add,
      retry,
      retryFailed,
      clear,
    }
  }, [items, online, uploaded, add, retry, retryFailed, clear])

  return <UploadContext value={value}>{children}</UploadContext>
}
