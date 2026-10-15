import { createContext, useContext } from 'react'

export type UploadStatus = 'waiting' | 'uploading' | 'done' | 'failed'

export interface UploadItem {
  id: string
  name: string
  file: File
  previewUrl: string
  status: UploadStatus
  progress: number
  attempts: number
  retryAt: number
  error?: string
  photoId?: string
}

export interface Uploads {
  items: UploadItem[]
  sent: number
  total: number
  /** Network is down while photos are still waiting */
  paused: boolean
  finished: boolean
  failedCount: number
  /** Photos sent from this tab, kept after the queue is cleared: the gallery waits for their processing */
  uploaded: { photoId: string; at: number }[]
  add: (files: FileList | File[]) => void
  retry: (id: string) => void
  retryFailed: () => void
  clear: () => void
}

export const UploadContext = createContext<Uploads | null>(null)

export function useUploads(): Uploads {
  const uploads = useContext(UploadContext)
  if (uploads === null) throw new Error('useUploads must be used inside UploadProvider')

  return uploads
}

/** Bytes sent across the whole queue, for the global progress bar */
export function overallProgress(items: UploadItem[]): number {
  if (items.length === 0) return 0

  return items.reduce((sum, item) => sum + (item.status === 'done' ? 1 : item.progress), 0) / items.length
}
