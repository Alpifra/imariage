import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api/client'
import type { Photo } from '../api/types'
import { Button } from '../components/Button'
import { CloseIcon, TrashIcon } from '../components/icons'
import { GridSkeleton, PhotoGrid } from '../components/PhotoGrid'
import { Dialog } from '../components/Sheet'
import { Toast } from '../components/Toast'
import { useGallery } from '../gallery/gallery'
import { groupByMoment } from '../gallery/sections'
import { useLoadMoreSentinel } from '../gallery/useLoadMoreSentinel'
import { GUEST_PARAM, useAdmin } from './admin'
import { formatBytes, formatCount, plural } from './format'
import styles from './AdminGallery.module.css'

const DELETE_CONCURRENCY = 4

async function deleteAll(ids: string[]): Promise<{ deleted: string[]; failed: number }> {
  const queue = [...ids]
  const deleted: string[] = []
  let failed = 0
  const worker = async () => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        await api.deletePhoto(id)
        deleted.push(id)
      } catch {
        failed++
      }
    }
  }
  await Promise.all(Array.from({ length: DELETE_CONCURRENCY }, worker))

  return { deleted, failed }
}

export function AdminGallery() {
  const gallery = useGallery()
  const { guests, reloadGuests } = useAdmin()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sentinel = useLoadMoreSentinel()
  const author = searchParams.get(GUEST_PARAM) ?? undefined
  const [selection, setSelection] = useState<{ author?: string; ids: Set<string> }>({ ids: new Set() })
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'status' | 'alert' } | null>(null)
  const { setFilter, remove } = gallery

  useEffect(() => {
    setFilter(author ? { author } : {})
  }, [author, setFilter])

  // A selection only makes sense for the guest filter it was made under
  const selected = useMemo(() => (selection.author === author ? selection.ids : new Set<string>()), [selection, author])
  const clearSelection = useCallback(() => setSelection({ author, ids: new Set() }), [author])

  useEffect(() => {
    if (selected.size === 0 || confirming) return
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  }, [selected.size, confirming, clearSelection])

  const toggle = (photo: Photo) => {
    const ids = new Set(selected)
    if (ids.has(photo.id)) ids.delete(photo.id)
    else ids.add(photo.id)
    setSelection({ author, ids })
  }

  const selectAll = () => setSelection({ author, ids: new Set(gallery.photos.map((photo) => photo.id)) })

  const confirmDelete = async () => {
    setDeleting(true)
    const { deleted, failed } = await deleteAll([...selected])
    setDeleting(false)
    setConfirming(false)
    remove(deleted)
    reloadGuests()
    clearSelection()
    setToast(failed > 0
      ? { tone: 'alert', message: `${plural(failed, 'photo n’a', 'photos n’ont')} pas pu être supprimée${failed > 1 ? 's' : ''}.` }
      : { tone: 'status', message: `${plural(deleted.length, 'photo supprimée', 'photos supprimées')}` })
  }

  const hideToast = useCallback(() => setToast(null), [])

  const sections = useMemo(
    () => groupByMoment(gallery.photos).map((section) => ({ ...section, sub: `${section.sub} · ${plural(section.photos.length, 'photo')}` })),
    [gallery.photos],
  )
  const authorGuest = guests.find((guest) => guest.id === author)
  const album = gallery.album
  const count = selected.size

  return (
    <div className={styles.page}>
      {count > 0 && (
        <div className={styles.selectionBar} role="toolbar" aria-label="Sélection">
          <button type="button" className={styles.iconButton} onClick={clearSelection} aria-label="Annuler la sélection"><CloseIcon size={24} /></button>
          <h2 aria-live="polite">{count === 1 ? '1 sélectionnée' : `${formatCount(count)} sélectionnées`}</h2>
          {count < gallery.photos.length && <button type="button" className={styles.barAction} onClick={selectAll}>Tout</button>}
          <button type="button" className={`${styles.barAction} ${styles.danger}`} onClick={() => setConfirming(true)}><TrashIcon size={20} />Supprimer</button>
        </div>
      )}

      {authorGuest ? (
        <p className={styles.stats}>
          <span><strong>{authorGuest.firstName} {authorGuest.lastName}</strong></span>
          <span>{plural(authorGuest.photoCount, 'photo')}</span>
        </p>
      ) : album && (
        <p className={styles.stats}>
          <span><strong>{formatCount(album.photoCount)}</strong> {album.photoCount === 1 ? 'photo' : 'photos'}</span>
          <span><strong>{formatCount(album.contributorCount)}</strong> {album.contributorCount === 1 ? 'invité' : 'invités'}</span>
          <span><strong>{formatBytes(album.storageBytes)}</strong> utilisés</span>
        </p>
      )}

      {guests.length > 0 && (
        <nav className={styles.chips} aria-label="Filtrer par invité">
          <Link to="/admin" className={styles.chip} aria-current={author === undefined}>Tous</Link>
          {guests.map((guest) => (
            <Link key={guest.id} to={`/admin?${GUEST_PARAM}=${guest.id}`} className={styles.chip} aria-current={author === guest.id} aria-label={`${guest.firstName} ${guest.lastName}, ${plural(guest.photoCount, 'photo')}`}>
              {guest.firstName} · {formatCount(guest.photoCount)}
            </Link>
          ))}
        </nav>
      )}

      {gallery.loading && gallery.photos.length === 0 ? (
        <GridSkeleton />
      ) : gallery.photos.length === 0 && !gallery.error ? (
        <p className={styles.empty}>Aucune photo pour l’instant.</p>
      ) : (
        <PhotoGrid
          sections={sections}
          selected={selected}
          onToggle={toggle}
          onOpen={(photo) => navigate(`/admin/photo/${photo.id}${author ? `?${GUEST_PARAM}=${author}` : ''}`, { state: { fromGallery: true } })}
        />
      )}

      {gallery.error && (
        <div role="alert" className={styles.loadError}>
          {gallery.photos.length === 0 ? 'Impossible de charger l’album.' : 'Impossible de charger la suite.'}
          <Button variant="tonal" size="small" onClick={gallery.retry}>Réessayer</Button>
        </div>
      )}
      {gallery.loadingMore && <p className={styles.loadingMore}>Chargement…</p>}
      <div ref={sentinel} className={styles.sentinel} />

      {count > 0 && (
        <div className={styles.bottomBar}>
          <button type="button" className={`${styles.barAction} ${styles.danger}`} onClick={() => setConfirming(true)}><TrashIcon size={24} />Supprimer</button>
        </div>
      )}

      {confirming && (
        <Dialog
          title={count === 1 ? 'Supprimer cette photo ?' : `Supprimer ${formatCount(count)} photos ?`}
          description={count === 1
            ? 'Elle sera retirée de l’album de tous les invités. Cette action est définitive.'
            : 'Elles seront retirées de l’album de tous les invités. Cette action est définitive.'}
          confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
          tone="danger"
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => !deleting && setConfirming(false)}
        />
      )}
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={hideToast} />}
      <Outlet />
    </div>
  )
}
