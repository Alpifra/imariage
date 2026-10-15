import { createContext, useContext } from 'react'
import type { Album, Photo } from '../api/types'

export interface GalleryFilter {
  mine?: boolean
  author?: string
}

export interface Gallery {
  filter: GalleryFilter
  setFilter: (filter: GalleryFilter) => void
  photos: Photo[]
  album: Album | null
  /** First page in flight */
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: boolean
  /** Newer photos fetched by polling, shown once the guest asks for them */
  pending: Photo[]
  loadMore: () => void
  retry: () => void
  showPending: () => void
  remove: (ids: string[]) => void
  reload: () => void
}

export const GalleryContext = createContext<Gallery | null>(null)

export function useGallery(): Gallery {
  const gallery = useContext(GalleryContext)
  if (gallery === null) throw new Error('useGallery must be used inside GalleryProvider')

  return gallery
}
