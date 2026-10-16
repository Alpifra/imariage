import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api/client'
import type { Guest } from '../api/types'
import { AlbumIcon, DownloadIcon, PhotoIcon } from '../components/icons'
import { ActionSheet } from '../components/Sheet'
import { COUPLE_NAMES } from '../config'
import { initials, useSession } from '../session/session'
import { GUEST_PARAM, type AdminContext } from './admin'
import { formatCount } from './format'
import styles from './AdminLayout.module.css'

function Navigation() {
  return (
    <>
      <NavLink to="/admin" end className={styles.navLink}><PhotoIcon size={22} />Photos</NavLink>
      <NavLink to="/admin/export" className={styles.navLink}><DownloadIcon size={22} />Export</NavLink>
    </>
  )
}

export function AdminLayout() {
  const { guest, setGuest } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [guests, setGuests] = useState<Guest[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    api.guests()
      .then((list) => setGuests(list.filter((item) => item.photoCount > 0).sort((a, b) => b.photoCount - a.photoCount)))
      .catch(() => undefined)
  }, [generation])

  const reloadGuests = useCallback(() => setGeneration((value) => value + 1), [])

  const logout = async () => {
    setMenuOpen(false)
    await api.logout().catch(() => undefined)
    // The device cookie may still identify this browser as a guest
    setGuest(await api.me().catch(() => null))
    navigate('/admin/connexion', { replace: true })
  }

  const onPhotos = location.pathname === '/admin' || location.pathname.startsWith('/admin/photo/')
  const author = searchParams.get(GUEST_PARAM)
  const total = guests.reduce((sum, item) => sum + item.photoCount, 0)
  const context: AdminContext = { guests, reloadGuests }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span aria-hidden="true" className={styles.logo}><AlbumIcon size={18} /></span>
        <span className={styles.brand}>{COUPLE_NAMES}</span>
        <nav className={styles.mobileNav} aria-label="Espace des mariés"><Navigation /></nav>
        {guest && <button type="button" className={styles.avatar} onClick={() => setMenuOpen(true)} aria-label={`Compte de ${guest.firstName}`}>{initials(guest)}</button>}
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav aria-label="Espace des mariés"><Navigation /></nav>
          {onPhotos && guests.length > 0 && (
            <nav aria-labelledby="guests-title" className={styles.guests}>
              <h2 id="guests-title" className={styles.sectionTitle}>Invités</h2>
              <Link to="/admin" className={styles.guest} aria-current={author === null}>
                <span>Tous les invités</span><span className={styles.count}>{formatCount(total)}</span>
              </Link>
              {guests.map((item) => (
                <Link key={item.id} to={`/admin?${GUEST_PARAM}=${item.id}`} className={styles.guest} aria-current={author === item.id}>
                  <span>{item.firstName} {item.lastName}</span><span className={styles.count}>{formatCount(item.photoCount)}</span>
                </Link>
              ))}
            </nav>
          )}
        </aside>
        <main className={styles.content}>
          <Outlet context={context} />
        </main>
      </div>
      {menuOpen && guest && (
        <ActionSheet
          title={`Connecté en tant que ${guest.firstName} ${guest.lastName}`}
          onCancel={() => setMenuOpen(false)}
          actions={[
            { label: 'Voir l’album des invités', onSelect: () => navigate('/') },
            { label: 'Se déconnecter', tone: 'danger', onSelect: () => void logout() },
          ]}
        />
      )}
    </div>
  )
}
