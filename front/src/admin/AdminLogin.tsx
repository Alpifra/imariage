import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { api, ApiError } from '../api/client'
import { Button } from '../components/Button'
import { AlbumIcon, EyeIcon, EyeOffIcon } from '../components/icons'
import { COUPLE_NAMES } from '../config'
import { useSession } from '../session/session'
import styles from './AdminLogin.module.css'

function loginError(error: unknown): string {
  if (error instanceof ApiError && error.detail.startsWith('Too many')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (error instanceof ApiError && error.status === 401) return 'Identifiant ou mot de passe incorrect.'

  return 'Connexion impossible pour le moment, réessayez dans un instant.'
}

export function AdminLogin() {
  const { guest, setGuest } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (guest?.isAdmin) return <Navigate to="/admin" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (username.trim() === '' || password === '') {
      setError('Renseignez votre identifiant et votre mot de passe.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.login(username.trim(), password)
      setGuest(await api.me())
      navigate('/admin', { replace: true })
    } catch (caught) {
      setError(loginError(caught))
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={(event) => void onSubmit(event)} noValidate>
        <div className={styles.brand}>
          <div aria-hidden="true" className={styles.logo}><AlbumIcon size={30} /></div>
          <h1>Espace des mariés</h1>
          <p>{COUPLE_NAMES}</p>
        </div>
        <div className={styles.field}>
          <label htmlFor="admin-username">Identifiant</label>
          <div className={styles.control}>
            <input id="admin-username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} aria-invalid={error ? true : undefined} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="admin-password">Mot de passe</label>
          <div className={`${styles.control} ${styles.password}`}>
            <input id="admin-password" type={revealed ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? 'admin-error' : undefined} />
            <button type="button" className={styles.reveal} onClick={() => setRevealed((value) => !value)} aria-label={revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={revealed}>
              {revealed ? <EyeOffIcon size={22} /> : <EyeIcon size={22} />}
            </button>
          </div>
        </div>
        {error && <p id="admin-error" role="alert" className={styles.error}>{error}</p>}
        <Button type="submit" block disabled={busy}>Se connecter</Button>
      </form>
    </main>
  )
}
