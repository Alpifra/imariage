import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { api, ApiError } from '../api/client'
import type { Photo } from '../api/types'
import { Button } from '../components/Button'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, TrashIcon } from '../components/icons'
import { ActionSheet } from '../components/Sheet'
import { Toast } from '../components/Toast'
import { useGallery } from '../gallery/gallery'
import { formatDayTime } from '../gallery/sections'
import { useSession } from '../session/session'
import styles from './Viewer.module.css'

const SWIPE_THRESHOLD_PX = 60
const CLOSE_THRESHOLD_PX = 100
const AXIS_LOCK_PX = 10
// Matches the transform transition in Viewer.module.css
const SLIDE_MS = 200
const SLIDE_GAP_PX = 16

export function Viewer() {
  const { id = '' } = useParams()
  const { guest } = useSession()
  const gallery = useGallery()
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.pathname.startsWith('/admin') ? '/admin' : ''
  const fromGallery = (location.state as { fromGallery?: boolean } | null)?.fromGallery === true
  const [standalone, setStandalone] = useState<{ id: string; photo: Photo | null }>()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [sliding, setSliding] = useState<{ from: string; direction: 1 | -1 }>()
  const drag = useRef<{ x: number; y: number; pointer: number; axis?: 'x' | 'y' } | null>(null)
  const slideTimer = useRef<number>(undefined)
  const strip = useRef<HTMLDivElement>(null)
  const deleted = useRef<string | null>(null)

  const index = gallery.photos.findIndex((photo) => photo.id === id)
  const photo = index >= 0 ? gallery.photos[index] : standalone?.id === id ? standalone.photo : undefined
  const previous = index > 0 ? gallery.photos[index - 1] : undefined
  const next = index >= 0 ? gallery.photos[index + 1] : undefined

  // Opened from a shared link or a reload: the photo is not in the loaded pages
  useEffect(() => {
    if (index >= 0 || gallery.loading || deleted.current === id) return
    api.photo(id)
      .then((found) => setStandalone({ id, photo: found }))
      .catch(() => setStandalone({ id, photo: null }))
  }, [id, index, gallery.loading])

  const close = useCallback(() => {
    if (fromGallery) navigate(-1)
    else navigate(`${base || '/'}${location.search}`, { replace: true })
  }, [fromGallery, navigate, base, location.search])

  const show = useCallback((target: Photo | undefined) => {
    if (target) navigate(`${base}/photo/${target.id}${location.search}`, { replace: true, state: location.state })
  }, [navigate, location.state, location.search, base])

  const { loadMore, photos: loaded } = gallery
  useEffect(() => {
    if (index >= 0 && index >= loaded.length - 3) loadMore()
  }, [index, loaded.length, loadMore])

  const slide = useCallback((direction: 1 | -1) => {
    const target = direction === 1 ? next : previous
    if (!target || sliding) return
    setSliding({ from: id, direction })
    slideTimer.current = window.setTimeout(() => {
      show(target)
      setSliding(undefined)
    }, SLIDE_MS)
  }, [next, previous, sliding, id, show])

  useEffect(() => () => window.clearTimeout(slideTimer.current), [])

  const hideDeleteError = useCallback(() => setDeleteError(false), [])

  // The gallery stays mounted underneath to keep its scroll position
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [id])

  useEffect(() => {
    if (confirming) return
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') slide(-1)
      if (event.key === 'ArrowRight') slide(1)
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  }, [confirming, slide, close])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Capturing the pointer would retarget the click away from the arrow buttons
    if ((event.target as Element).closest('button')) return
    drag.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (current?.pointer !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return
      current.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
    }
    if (current.axis === 'y') {
      setOffset({ x: 0, y: dy > 0 ? dy : dy / 4 })
    } else {
      // Resist at both ends of the album
      setOffset({ x: (dx > 0 && !previous) || (dx < 0 && !next) ? dx / 4 : dx, y: 0 })
    }
  }

  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    // Leaving the photo where it was dropped avoids a snap back while the viewer unmounts
    if (offset.y > CLOSE_THRESHOLD_PX) {
      close()
      return
    }
    if (offset.x > SWIPE_THRESHOLD_PX) slide(-1)
    if (offset.x < -SWIPE_THRESHOLD_PX) slide(1)
    setOffset({ x: 0, y: 0 })
  }

  const remove = async () => {
    if (!photo) return
    setDeleting(true)
    try {
      await api.deletePhoto(photo.id)
      deleted.current = photo.id
      gallery.remove([photo.id])
      setConfirming(false)
      if (next ?? previous) show(next ?? previous)
      else close()
    } catch (error) {
      setConfirming(false)
      if (error instanceof ApiError && error.status === 404) {
        gallery.remove([photo.id])
        close()
      } else {
        setDeleteError(true)
      }
    } finally {
      setDeleting(false)
    }
  }

  if (photo === null) {
    return (
      <main className={styles.viewer}>
        <div className={styles.missing}>
          <p>Cette photo n'est plus disponible.</p>
          <Button variant="tonal" onClick={() => navigate(base || '/', { replace: true })}>Retour à l'album</Button>
        </div>
      </main>
    )
  }

  if (!photo) return <main className={styles.viewer} aria-busy="true" />

  const canDelete = photo.mine || guest?.isAdmin === true
  // Keyed by photo id, the neighbour that slid in stays mounted and in place once the URL changes
  const shift = sliding?.from === photo.id ? sliding.direction : 0
  const slides: [Photo | undefined, number][] = [[previous, -1], [photo, 0], [next, 1]]

  return (
    <main
      className={[styles.viewer, offset.x === 0 && offset.y === 0 && styles.settling].filter(Boolean).join(' ')}
      aria-label="Visionneuse"
      style={offset.y > 0 ? { backgroundColor: `color-mix(in srgb, var(--color-viewer) ${Math.max(0, 100 - offset.y / 4)}%, transparent)` } : undefined}
    >
      <header className={styles.header}>
        <button type="button" className={styles.iconButton} onClick={close} aria-label="Fermer"><CloseIcon size={24} /></button>
        <div className={styles.meta}>
          <strong>{photo.authorName}</strong>
          <span>{formatDayTime(photo.createdAt)}</span>
        </div>
        {canDelete ? (
          <button type="button" className={styles.iconButton} onClick={() => setConfirming(true)} aria-label="Supprimer la photo"><TrashIcon size={22} /></button>
        ) : (
          <span className={styles.iconButton} />
        )}
      </header>

      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {slides.map(([item, position]) => item && (
          <img
            key={item.id}
            src={item.mediumUrl}
            alt={position === 0 ? `Photo de ${item.authorName}` : ''}
            aria-hidden={position !== 0}
            draggable={false}
            style={{ transform: `translate(calc(${(position - shift) * 100}% + ${(position - shift) * SLIDE_GAP_PX + offset.x}px), ${offset.y}px)` }}
          />
        ))}
        {previous && <button type="button" className={`${styles.iconButton} ${styles.nav} ${styles.prev}`} onClick={() => slide(-1)} aria-label="Photo précédente"><ChevronLeftIcon size={24} /></button>}
        {next && <button type="button" className={`${styles.iconButton} ${styles.nav} ${styles.next}`} onClick={() => slide(1)} aria-label="Photo suivante"><ChevronRightIcon size={24} /></button>}
      </div>

      {index >= 0 && (
        <>
          <div ref={strip} className={styles.strip} aria-label="Miniatures">
            {gallery.photos.map((item) => (
              <button key={item.id} type="button" aria-current={item.id === photo.id} aria-label={`Photo de ${item.authorName}`} onClick={() => show(item)}>
                <img src={item.thumbnailUrl} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className={styles.footer}>
            {index + 1} sur {gallery.hasMore ? `${gallery.photos.length}+` : gallery.photos.length} · Glissez pour naviguer
          </div>
        </>
      )}

      {confirming && (
        <ActionSheet
          role="alertdialog"
          title="Supprimer cette photo ?"
          description="Elle sera retirée de l'album pour tous les invités."
          onCancel={() => !deleting && setConfirming(false)}
          actions={[{ label: 'Supprimer la photo', tone: 'danger', onSelect: () => { if (!deleting) void remove() } }]}
        />
      )}
      {deleteError && <Toast tone="alert" message="La photo n’a pas pu être supprimée." onDismiss={hideDeleteError} />}
    </main>
  )
}
