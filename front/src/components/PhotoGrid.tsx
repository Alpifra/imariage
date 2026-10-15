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
  const selecting = selected !== undefined && onToggle !== undefined

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
            <button
              key={photo.id}
              type="button"
              className={[styles.tile, isSelected && styles.selected].filter(Boolean).join(' ')}
              aria-label={`Photo de ${photo.authorName}`}
              aria-pressed={selecting ? isSelected : undefined}
              onClick={() => (selecting ? onToggle(photo) : onOpen(photo))}
            >
              <img src={photo.thumbnailUrl} alt="" loading="lazy" decoding="async" />
              {selecting && <span className={styles.check} aria-hidden="true">{isSelected && <CheckIcon size={14} />}</span>}
            </button>
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
