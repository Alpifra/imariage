import { useEffect, useRef } from 'react'
import { useGallery } from './gallery'

/** Ref for an element at the end of the grid: the next page loads before it scrolls into view */
export function useLoadMoreSentinel() {
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasMore, loadingMore, error, loadMore } = useGallery()

  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasMore || loadingMore || error) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    }, { rootMargin: '600px 0px' })
    observer.observe(element)

    return () => observer.disconnect()
  }, [hasMore, loadingMore, error, loadMore])

  return sentinel
}
