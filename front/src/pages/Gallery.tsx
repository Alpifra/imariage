import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import type { Photo } from '../api/types'
import { Button } from '../components/Button'
import { Bouquet } from '../components/Floral'
import { AlbumIcon, ArrowUpIcon, CloseIcon, PlusIcon, TrashIcon } from '../components/icons'
import { GridSkeleton, PhotoGrid } from '../components/PhotoGrid'
import { SegmentedControl } from '../components/SegmentedControl'
import { ActionSheet } from '../components/Sheet'
import { OfflineBanner, Toast } from '../components/Toast'
import { COUPLE_NAMES } from '../config'
import { deletePhotos } from '../gallery/deletePhotos'
import { groupByMoment } from '../gallery/sections'
import { useGallery } from '../gallery/gallery'
import { useLoadMoreSentinel } from '../gallery/useLoadMoreSentinel'
import { initials, useSession } from '../session/session'
import { useOnline } from '../session/useOnline'
import { AddPhotos, type AddPhotosHandle } from '../upload/AddPhotos'
import { UploadIndicator } from '../upload/UploadIndicator'
import styles from './Gallery.module.css'

type Scope = 'all' | 'mine'

function albumStats(photoCount: number, contributorCount: number): string {
  if (photoCount === 0) return 'Aucune photo'
  const photos = photoCount === 1 ? '1 photo' : `${photoCount} photos`
  const guests = contributorCount === 1 ? '1 invité' : `${contributorCount} invités`

  return `${photos} · ${guests}`
}

const photoCount = (count: number) => (count === 1 ? '1 photo' : `${count} photos`)

export function Gallery() {
  const { guest } = useSession()
  const gallery = useGallery()
  const online = useOnline()
  const navigate = useNavigate()
  const addPhotos = useRef<AddPhotosHandle>(null)
  const sentinel = useLoadMoreSentinel()
  const { setFilter } = gallery
  const scope: Scope = gallery.filter.mine ? 'mine' : 'all'
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'status' | 'alert' } | null>(null)
  const { remove } = gallery

  // The admin pages share the gallery state and may have left an author filter behind
  useEffect(() => {
    if (gallery.filter.author) setFilter({})
  }, [gallery.filter.author, setFilter])

  const sections = useMemo(() => groupByMoment(gallery.photos), [gallery.photos])

  // Photos removed meanwhile (viewer, another device) must drop out of the selection
  const selected = useMemo(
    () => new Set(scope === 'mine' ? gallery.photos.filter((photo) => selection.has(photo.id)).map((photo) => photo.id) : []),
    [scope, gallery.photos, selection],
  )
  const count = selected.size
  const clearSelection = useCallback(() => setSelection(new Set()), [])

  useEffect(() => {
    if (count === 0 || confirming) return
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  }, [count, confirming, clearSelection])

  const toggle = (photo: Photo) => {
    const ids = new Set(selected)
    if (ids.has(photo.id)) ids.delete(photo.id)
    else ids.add(photo.id)
    setSelection(ids)
  }

  const select = (photo: Photo) => setSelection(new Set(selected).add(photo.id))

  const selectAll = () => setSelection(new Set(gallery.photos.map((photo) => photo.id)))

  const confirmDelete = async () => {
    setDeleting(true)
    const { deleted, failed } = await deletePhotos([...selected])
    setDeleting(false)
    setConfirming(false)
    remove(deleted)
    clearSelection()
    setToast(failed > 0
      ? { tone: 'alert', message: failed === 1 ? '1 photo n’a pas pu être supprimée.' : `${failed} photos n’ont pas pu être supprimées.` }
      : { tone: 'status', message: deleted.length === 1 ? '1 photo supprimée' : `${deleted.length} photos supprimées` })
  }

  const hideToast = useCallback(() => setToast(null), [])

  if (!guest) return null

  return (
    <main className={styles.screen}>
      {count > 0 && (
        <div className={styles.selectionBar} role="toolbar" aria-label="Sélection">
          <button type="button" className={styles.iconButton} onClick={clearSelection} aria-label="Annuler la sélection"><CloseIcon size={24} /></button>
          <h2 aria-live="polite">{count === 1 ? '1 sélectionnée' : `${count} sélectionnées`}</h2>
          {count < gallery.photos.length && <button type="button" className={styles.barAction} onClick={selectAll}>Tout</button>}
        </div>
      )}

      <header className={styles.header}>
        <div>
          <h1>{COUPLE_NAMES}</h1>
          {gallery.album && <p className={styles.stats}>{albumStats(gallery.album.photoCount, gallery.album.contributorCount)}</p>}
        </div>
        {guest.isAdmin ? (
          <Link to="/admin" className={styles.avatar} aria-label="Espace des mariés">{initials(guest)}</Link>
        ) : (
          <span className={styles.avatar} role="img" aria-label={`Connecté en tant que ${guest.firstName} ${guest.lastName}`}>{initials(guest)}</span>
        )}
      </header>
      <Bouquet corner="top-right" width={190} x={50} y={60} opacity={0.2} />

      {!online && (
        <OfflineBanner title="Hors connexion." className={styles.banner}>
          Les nouvelles photos s'afficheront au retour du réseau.
        </OfflineBanner>
      )}

      {gallery.pending.length > 0 && (
        <button type="button" className={styles.pill} onClick={gallery.showPending}>
          <ArrowUpIcon size={16} />
          {gallery.pending.length === 1 ? '1 nouvelle photo' : `${gallery.pending.length} nouvelles photos`}
        </button>
      )}

      {gallery.loading && gallery.photos.length === 0 ? (
        <GridSkeleton />
      ) : gallery.photos.length === 0 && !gallery.error ? (
        <div className={styles.empty}>
          <AlbumIcon size={56} />
          <h2>{scope === 'mine' ? 'Vous n’avez pas encore partagé de photo' : 'Aucune photo pour l’instant'}</h2>
          <p>{scope === 'mine' ? 'Les photos que vous ajoutez apparaîtront ici.' : 'Soyez le premier à partager un moment de la journée !'}</p>
          <Bouquet corner="bottom-right" width={250} x={70} y={0} opacity={0.22} className={styles.emptyBouquet} />
        </div>
      ) : (
        <>
          {scope === 'mine' && <p className={styles.hint}>Appuyez longuement sur une photo pour en sélectionner plusieurs.</p>}
          <PhotoGrid
            sections={sections}
            selected={count > 0 ? selected : undefined}
            onToggle={toggle}
            onLongPress={scope === 'mine' ? select : undefined}
            onOpen={(photo) => navigate(`/photo/${photo.id}`, { state: { fromGallery: true } })}
          />
        </>
      )}

      {gallery.error && (
        <div role="alert" className={styles.loadError}>
          {gallery.photos.length === 0 ? 'Impossible de charger l’album.' : 'Impossible de charger la suite.'}
          <Button variant="tonal" size="small" onClick={gallery.retry}>Réessayer</Button>
        </div>
      )}
      {gallery.loadingMore && <div className={styles.loadingMore}>Chargement…</div>}
      <div ref={sentinel} className={styles.sentinel} />

      <div className={styles.dock}>
        <UploadIndicator />
        {count > 0 ? (
          <div className={styles.bar}>
            <button type="button" className={styles.delete} onClick={() => setConfirming(true)}>
              <TrashIcon size={20} />
              Supprimer
            </button>
          </div>
        ) : (
          <div className={styles.bar}>
            <SegmentedControl<Scope>
              label="Photos affichées"
              className={styles.segments}
              options={[{ value: 'all', label: 'Toutes' }, { value: 'mine', label: 'Mes photos' }]}
              value={scope}
              onChange={(value) => { setFilter(value === 'mine' ? { mine: true } : {}); clearSelection(); window.scrollTo({ top: 0 }) }}
            />
            <button type="button" className={styles.add} onClick={() => addPhotos.current?.open()}>
              <PlusIcon size={20} />
              Ajouter
            </button>
          </div>
        )}
      </div>
      <AddPhotos ref={addPhotos} />
      {confirming && (
        <ActionSheet
          role="alertdialog"
          title={count === 1 ? 'Supprimer cette photo ?' : `Supprimer ${photoCount(count)} ?`}
          description={count === 1 ? 'Elle sera retirée de l’album pour tous les invités.' : 'Elles seront retirées de l’album pour tous les invités.'}
          onCancel={() => !deleting && setConfirming(false)}
          actions={[{
            label: deleting ? 'Suppression…' : `Supprimer ${count === 1 ? 'la photo' : `les ${photoCount(count)}`}`,
            tone: 'danger',
            onSelect: () => { if (!deleting) void confirmDelete() },
          }]}
        />
      )}
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={hideToast} />}
      <Outlet />
    </main>
  )
}
