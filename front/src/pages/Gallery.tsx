import { useEffect, useMemo, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { AlbumIcon, ArrowUpIcon, PlusIcon } from '../components/icons'
import { GridSkeleton, PhotoGrid } from '../components/PhotoGrid'
import { SegmentedControl } from '../components/SegmentedControl'
import { OfflineBanner } from '../components/Toast'
import { COUPLE_NAMES } from '../config'
import { groupByMoment } from '../gallery/sections'
import { useGallery } from '../gallery/gallery'
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

export function Gallery() {
  const { guest } = useSession()
  const gallery = useGallery()
  const online = useOnline()
  const navigate = useNavigate()
  const addPhotos = useRef<AddPhotosHandle>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const { setFilter, loadMore, hasMore, loadingMore, error } = gallery
  const scope: Scope = gallery.filter.mine ? 'mine' : 'all'

  // The admin pages share the gallery state and may have left an author filter behind
  useEffect(() => {
    if (gallery.filter.author) setFilter({})
  }, [gallery.filter.author, setFilter])

  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasMore || loadingMore || error) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    }, { rootMargin: '600px 0px' })
    observer.observe(element)

    return () => observer.disconnect()
  }, [hasMore, loadingMore, error, loadMore])

  const sections = useMemo(() => groupByMoment(gallery.photos), [gallery.photos])

  if (!guest) return null

  return (
    <main className={styles.screen}>
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
        </div>
      ) : (
        <PhotoGrid sections={sections} onOpen={(photo) => navigate(`/photo/${photo.id}`, { state: { fromGallery: true } })} />
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
        <div className={styles.bar}>
          <SegmentedControl<Scope>
            label="Photos affichées"
            className={styles.segments}
            options={[{ value: 'all', label: 'Toutes' }, { value: 'mine', label: 'Mes photos' }]}
            value={scope}
            onChange={(value) => { setFilter(value === 'mine' ? { mine: true } : {}); window.scrollTo({ top: 0 }) }}
          />
          <button type="button" className={styles.add} onClick={() => addPhotos.current?.open()}>
            <PlusIcon size={20} />
            Ajouter
          </button>
        </div>
      </div>
      <AddPhotos ref={addPhotos} />
      <Outlet />
    </main>
  )
}
