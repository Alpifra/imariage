import { useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { buttonClass } from '../components/buttonClass'
import { CheckIcon, ChevronLeftIcon } from '../components/icons'
import { ProgressBar } from '../components/ProgressBar'
import { OfflineBanner } from '../components/Toast'
import { useSession } from '../session/session'
import { AddPhotos, type AddPhotosHandle } from '../upload/AddPhotos'
import { overallProgress, useUploads, type UploadItem } from '../upload/uploads'
import styles from './Upload.module.css'

function statusLabel(item: UploadItem, paused: boolean): string {
  if (item.status === 'done') return 'Envoyée'
  if (item.status === 'failed') return item.error ?? 'Échec de l’envoi'
  if (item.status === 'uploading') return `Envoi en cours… ${Math.round(item.progress * 100)} %`
  if (paused) return 'En pause'

  return item.attempts > 0 ? 'Nouvelle tentative bientôt' : 'En attente'
}

export function Upload() {
  const { guest } = useSession()
  const uploads = useUploads()
  const navigate = useNavigate()
  const addPhotos = useRef<AddPhotosHandle>(null)
  const { items, sent, total, paused, finished, failedCount } = uploads

  if (total === 0) return <Navigate to="/" replace />

  if (finished && failedCount === 0) {
    return (
      <main className={styles.thanks}>
        <div aria-hidden="true" className={styles.check}><CheckIcon size={36} /></div>
        <div role="status" className={styles.thanksText}>
          <h1>Merci {guest?.firstName}&nbsp;!</h1>
          <p>{sent === 1 ? 'Votre photo a été ajoutée à l’album.' : `Vos ${sent} photos ont été ajoutées à l’album.`}</p>
        </div>
        <Button block onClick={() => { uploads.clear(); navigate('/') }}>Voir l'album</Button>
        <Button block variant="tonal" onClick={() => addPhotos.current?.open()}>Ajouter d'autres photos</Button>
        <AddPhotos ref={addPhotos} />
      </main>
    )
  }

  const percent = Math.round(overallProgress(items) * 100)

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}><ChevronLeftIcon size={26} />Album</Link>
        <h1>Envoi</h1>
      </header>

      <section className={styles.summary} aria-label="Avancement de l'envoi">
        {paused && (
          <OfflineBanner title="Connexion perdue." className={styles.banner}>L'envoi reprendra automatiquement.</OfflineBanner>
        )}
        <div className={styles.summaryLine}>
          <strong>{sent} sur {total} envoyée{sent > 1 ? 's' : ''}</strong>
          <span>{paused ? 'En pause' : `${percent} %`}</span>
        </div>
        <ProgressBar value={percent / 100} label="Progression globale" height={6} muted={paused} />
        {failedCount > 0 && finished && (
          <Button variant="tonal" size="small" onClick={uploads.retryFailed}>
            Réessayer {failedCount === 1 ? 'la photo en échec' : `les ${failedCount} photos en échec`}
          </Button>
        )}
      </section>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <img src={item.previewUrl} alt="" className={styles.thumb} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
            <div className={styles.rowBody}>
              <span className={styles.name}>{item.name}</span>
              {item.status === 'uploading' && <ProgressBar value={item.progress} />}
              <span className={[styles.status, item.status === 'done' && styles.done, item.status === 'failed' && styles.failed].filter(Boolean).join(' ')}>
                {statusLabel(item, paused)}
              </span>
            </div>
            {item.status === 'failed' && <Button variant="text" size="small" onClick={() => uploads.retry(item.id)}>Réessayer</Button>}
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <Link to="/" className={buttonClass('tonal', true)}>Parcourir l'album pendant l'envoi</Link>
      </div>
    </main>
  )
}
