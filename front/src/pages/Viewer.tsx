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
  const [offset, setOffset] = useState(0)
  const drag = useRef<{ x: number; pointer: number } | null>(null)
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
      if (event.key === 'ArrowLeft') show(previous)
      if (event.key === 'ArrowRight') show(next)
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  }, [confirming, previous, next, show, close])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Capturing the pointer would retarget the click away from the arrow buttons
    if ((event.target as Element).closest('button')) return
    drag.current = { x: event.clientX, pointer: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return
    const delta = event.clientX - drag.current.x
    // Resist at both ends of the album
    setOffset((delta > 0 && !previous) || (delta < 0 && !next) ? delta / 4 : delta)
  }

  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    if (offset > SWIPE_THRESHOLD_PX) show(previous)
    if (offset < -SWIPE_THRESHOLD_PX) show(next)
    setOffset(0)
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

  return (
    <main className={styles.viewer} aria-label="Visionneuse">
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
        className={[styles.stage, offset === 0 && styles.settling].filter(Boolean).join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img key={photo.id} src={photo.mediumUrl} alt={`Photo de ${photo.authorName}`} draggable={false} style={{ transform: `translateX(${offset}px)` }} />
        {previous && <button type="button" className={`${styles.iconButton} ${styles.nav} ${styles.prev}`} onClick={() => show(previous)} aria-label="Photo précédente"><ChevronLeftIcon size={24} /></button>}
        {next && <button type="button" className={`${styles.iconButton} ${styles.nav} ${styles.next}`} onClick={() => show(next)} aria-label="Photo suivante"><ChevronRightIcon size={24} /></button>}
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
