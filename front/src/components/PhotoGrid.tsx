import { useEffect, useRef, type PointerEvent } from 'react'
import type { Photo } from '../api/types'
import type { PhotoSection } from '../gallery/sections'
import { CheckIcon } from './icons'
import styles from './PhotoGrid.module.css'

const LONG_PRESS_MS = 500
const LONG_PRESS_TOLERANCE_PX = 10

interface PhotoGridProps {
  sections: PhotoSection[]
  onOpen: (photo: Photo) => void
  selected?: Set<string>
  onToggle?: (photo: Photo) => void
  onLongPress?: (photo: Photo) => void
}

export function PhotoGrid({ sections, onOpen, selected, onToggle, onLongPress }: PhotoGridProps) {
  const selectable = selected !== undefined && onToggle !== undefined
  // Once something is selected, tapping a tile extends the selection instead of opening it
  const selecting = selectable && selected.size > 0
  const press = useRef<{ timeout: number; x: number; y: number } | null>(null)
  // The click that follows a long press must not open or toggle the photo again
  const longPressed = useRef(false)

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timeout)
    press.current = null
  }

  useEffect(() => () => {
    if (press.current) window.clearTimeout(press.current.timeout)
  }, [])

  const startPress = (event: PointerEvent, photo: Photo) => {
    longPressed.current = false
    cancelPress()
    if (!onLongPress || !event.isPrimary || event.button !== 0) return
    press.current = {
      x: event.clientX,
      y: event.clientY,
      timeout: window.setTimeout(() => {
        press.current = null
        longPressed.current = true
        onLongPress(photo)
      }, LONG_PRESS_MS),
    }
  }

  const movePress = (event: PointerEvent) => {
    if (press.current && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > LONG_PRESS_TOLERANCE_PX) cancelPress()
  }

  const click = (photo: Photo) => {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (selecting) onToggle(photo)
    else onOpen(photo)
  }

  return sections.map((section) => (
    <section key={section.key} aria-label={`${section.title}, ${section.sub}`}>
      <div className={styles.sectionHeader}>
        <h2>{section.title}</h2>
        <span>{section.sub}</span>
      </div>
      <div className={styles.grid}>
        {section.photos.map((photo) => {
          const isSelected = selected?.has(photo.id) ?? false

          return (
            <div key={photo.id} className={[styles.tile, isSelected && styles.selected].filter(Boolean).join(' ')}>
              <button
                type="button"
                className={[styles.open, onLongPress && styles.pressable].filter(Boolean).join(' ')}
                aria-label={`Photo de ${photo.authorName}`}
                onClick={() => click(photo)}
                onPointerDown={(event) => startPress(event, photo)}
                onPointerMove={movePress}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onContextMenu={onLongPress && ((event) => event.preventDefault())}
              >
                <img src={photo.thumbnailUrl} alt="" loading="lazy" decoding="async" />
              </button>
              {selectable && (
                <button type="button" className={styles.check} aria-label={`Sélectionner la photo de ${photo.authorName}`} aria-pressed={isSelected} onClick={() => onToggle(photo)}>
                  {isSelected && <CheckIcon size={14} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  ))
}

export function GridSkeleton({ count = 21 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <div key={index} className={styles.skeleton} />)}
    </div>
  )
}
