import type { Photo } from '../api/types'
import type { PhotoSection } from '../gallery/sections'
import { CheckIcon } from './icons'
import styles from './PhotoGrid.module.css'

interface PhotoGridProps {
  sections: PhotoSection[]
  onOpen: (photo: Photo) => void
  selected?: Set<string>
  onToggle?: (photo: Photo) => void
}

export function PhotoGrid({ sections, onOpen, selected, onToggle }: PhotoGridProps) {
  const selectable = selected !== undefined && onToggle !== undefined
  // Once something is selected, tapping a tile extends the selection instead of opening it
  const selecting = selectable && selected.size > 0

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
              <button type="button" className={styles.open} aria-label={`Photo de ${photo.authorName}`} onClick={() => (selecting ? onToggle(photo) : onOpen(photo))}>
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
