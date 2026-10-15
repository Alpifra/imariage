import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { api, ApiError } from '../api/client'
import type { Guest, Photo } from '../api/types'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/Sheet'
import { FieldError, FieldGroup, TextField } from '../components/TextField'
import { COUPLE_INITIALS, COUPLE_NAMES, WEDDING_DETAILS } from '../config'
import { initials, useSession } from '../session/session'
import { InvalidLink } from './InvalidLink'
import styles from './Welcome.module.css'

type CodeState = 'checking' | 'valid' | 'invalid'

export function Welcome() {
  const { guest, setGuest, eventCode } = useSession()
  const navigate = useNavigate()
  const [codeState, setCodeState] = useState<CodeState>(eventCode ? 'checking' : 'invalid')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const [knownName, setKnownName] = useState<string | null>(null)
  const [welcomeBack, setWelcomeBack] = useState<Guest | null>(null)

  useEffect(() => {
    if (!eventCode) return
    api.checkEventCode(eventCode)
      .then(() => setCodeState('valid'))
      .catch((error: unknown) => setCodeState(error instanceof ApiError && error.status === 404 ? 'invalid' : 'valid'))
  }, [eventCode])

  if (welcomeBack) return <WelcomeBack guest={welcomeBack} onContinue={() => { setGuest(welcomeBack); navigate('/', { replace: true }) }} />
  if (guest) return <Navigate to="/" replace />
  if (codeState === 'invalid') return <InvalidLink />

  const submit = async (sameGuest?: boolean) => {
    if (!eventCode) return
    setBusy(true)
    setErrors({})
    try {
      const identified = await api.identify(firstName, lastName, eventCode, sameGuest)
      setKnownName(null)
      if (sameGuest && identified.photoCount > 0) {
        setWelcomeBack(identified)
      } else {
        setGuest(identified)
        navigate('/', { replace: true })
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setKnownName(error.detail)
      } else if (error instanceof ApiError && error.status === 403) {
        setCodeState('invalid')
      } else if (error instanceof ApiError && error.status === 422) {
        setErrors({ firstName: error.violations.firstName, lastName: error.violations.lastName, form: error.violations.eventCode })
      } else {
        setErrors({ form: 'Connexion impossible pour le moment, réessayez dans un instant.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const missing = {
      firstName: firstName.trim() === '' ? 'Indiquez votre prénom pour continuer.' : undefined,
      lastName: lastName.trim() === '' ? 'Indiquez votre nom pour continuer.' : undefined,
    }
    if (missing.firstName || missing.lastName) {
      setErrors(missing)
      return
    }
    void submit()
  }

  const fieldError = errors.firstName ?? errors.lastName ?? errors.form

  return (
    <main className={styles.screen} aria-hidden={knownName ? true : undefined}>
      <div aria-hidden="true" className={styles.hero}>{COUPLE_INITIALS}</div>
      <div className={styles.heading}>
        <div className={styles.kicker}>Bienvenue au mariage de</div>
        <h1 className={styles.title}>{COUPLE_NAMES}</h1>
        {WEDDING_DETAILS && <div className={styles.details}>{WEDDING_DETAILS}</div>}
      </div>
      <p className={styles.intro}>Partagez vos plus beaux moments de la journée.</p>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField label="Prénom" autoComplete="given-name" placeholder="Camille" value={firstName} onChange={(event) => setFirstName(event.target.value)} error={errors.firstName} maxLength={100} />
          <TextField label="Nom" autoComplete="family-name" placeholder="Durand" value={lastName} onChange={(event) => setLastName(event.target.value)} error={errors.lastName} maxLength={100} />
        </FieldGroup>
        {fieldError && <FieldError>{fieldError}</FieldError>}
        <Button type="submit" block disabled={busy || codeState === 'checking'}>C'est parti</Button>
      </form>
      <div className={styles.hint}>Pas de compte, pas d'application à installer.</div>

      {knownName && (
        <BottomSheet labelledBy="known-question">
          <div aria-hidden="true" className={styles.avatar}>{initials({ firstName: knownName, lastName: knownName.split(' ').slice(1).join(' ') })}</div>
          <div className={styles.knownName}>
            <strong>{knownName}</strong>
            <span>a déjà rejoint l'album</span>
          </div>
          <h2 id="known-question" className={styles.question}>Vous avez déjà partagé des photos depuis un autre appareil ?</h2>
          <Button block disabled={busy} onClick={() => void submit(true)}>Oui, c'est moi</Button>
          <Button block variant="tonal" disabled={busy} onClick={() => void submit(false)}>Non, ce n'est pas moi</Button>
          <p className={styles.reassurance}>Pas de souci si c'est un homonyme : vous rejoindrez simplement l'album de votre côté.</p>
        </BottomSheet>
      )}
    </main>
  )
}

function WelcomeBack({ guest, onContinue }: { guest: Guest; onContinue: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    api.photos({ mine: true }).then(setPhotos).catch(() => undefined)
  }, [])

  const shown = photos.slice(0, guest.photoCount > 4 ? 3 : 4)
  const remaining = guest.photoCount - shown.length

  return (
    <main className={styles.centered}>
      <div aria-hidden="true" className={styles.mosaic}>
        {shown.map((photo) => <img key={photo.id} src={photo.thumbnailUrl} alt="" />)}
        {Array.from({ length: Math.max(0, (remaining > 0 ? 3 : 4) - shown.length) }, (_, index) => <div key={index} />)}
        {remaining > 0 && <div className={styles.more}>+{remaining}</div>}
      </div>
      <div role="status" className={styles.message}>
        <h1>Ravi de vous revoir, {guest.firstName}&nbsp;!</h1>
        <p>{guest.photoCount === 1 ? 'Votre photo vous attend.' : `Vos ${guest.photoCount} photos vous attendent.`}</p>
      </div>
      <Button block onClick={onContinue} autoFocus>Voir l'album</Button>
    </main>
  )
}
