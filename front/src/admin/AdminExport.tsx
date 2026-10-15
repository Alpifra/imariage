import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ExportJob } from '../api/types'
import { Button } from '../components/Button'
import { buttonClass } from '../components/buttonClass'
import { CheckIcon, DownloadIcon } from '../components/icons'
import { ProgressBar } from '../components/ProgressBar'
import { Toast } from '../components/Toast'
import { useGallery } from '../gallery/gallery'
import { useAdmin } from './admin'
import { formatBytes, formatCount, formatDateTime, plural } from './format'
import styles from './AdminExport.module.css'

const POLLING_INTERVAL_MS = 2_000

const inProgress = (job: ExportJob) => job.status === 'pending' || job.status === 'processing'
const jobName = (job: ExportJob) => job.authorName ?? 'Toutes les photos'

function remaining(job: ExportJob, now: number): string {
  const elapsed = now - new Date(job.createdAt).getTime()
  if (job.processedCount === 0 || elapsed <= 0) return 'Préparation de l’archive…'
  const minutes = Math.round((elapsed / job.processedCount) * (job.photoCount - job.processedCount) / 60_000)

  return `Préparation de l’archive · ${minutes < 1 ? 'moins d’une minute' : `environ ${minutes} min`}`
}

export function AdminExport() {
  const { guests } = useAdmin()
  const { album } = useGallery()
  const [jobs, setJobs] = useState<ExportJob[] | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [requested, setRequested] = useState<string[]>([])
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const polling = jobs?.some(inProgress) ?? false

  useEffect(() => {
    const load = () => api.exports()
      .then((list) => {
        setJobs(list)
        setNow(Date.now())
      })
      .catch(() => setJobs((current) => current ?? []))
    void load()
    if (!polling) return

    const interval = window.setInterval(() => void load(), POLLING_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [polling])

  const create = async (guestId?: string) => {
    setBusy(true)
    try {
      const job = await api.createExport(guestId)
      setJobs((current) => [job, ...(current ?? [])])
      setRequested((current) => [...current, job.id])
    } catch {
      setError('L’export n’a pas pu être lancé. Réessayez dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  const selectedAuthor = author || guests[0]?.id
  const running = jobs?.filter(inProgress) ?? []
  const justReady = jobs?.filter((job) => job.status === 'ready' && requested.includes(job.id)) ?? []
  const history = jobs?.filter((job) => !inProgress(job)) ?? []

  return (
    <div className={styles.page}>
      <h1>Export</h1>

      <section className={styles.card} aria-label="Nouvel export">
        <div className={styles.option}>
          <div className={styles.optionText}>
            <h2>Toutes les photos</h2>
            <p>{album ? `${plural(album.photoCount, 'photo')} · ${formatBytes(album.storageBytes)} · ` : ''}qualité originale</p>
          </div>
          <Button size="small" disabled={busy || album?.photoCount === 0} onClick={() => void create()}>
            <DownloadIcon size={20} />Télécharger toutes les photos (ZIP)
          </Button>
        </div>
        <div className={styles.option}>
          <div className={styles.optionText}>
            <h2>Par invité</h2>
            <p>Les photos d’une seule personne</p>
          </div>
          <div className={styles.byGuest}>
            <select className={styles.select} aria-label="Invité à exporter" value={selectedAuthor ?? ''} onChange={(event) => setAuthor(event.target.value)} disabled={guests.length === 0}>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName} — {plural(guest.photoCount, 'photo')}</option>
              ))}
            </select>
            <Button size="small" variant="tonal" disabled={busy || !selectedAuthor} onClick={() => void create(selectedAuthor)}>Exporter</Button>
          </div>
        </div>
      </section>

      {(running.length > 0 || justReady.length > 0) && <h2 className={styles.heading}>En cours</h2>}
      {running.map((job) => {
        const ratio = job.photoCount > 0 ? job.processedCount / job.photoCount : 0

        return (
          <div key={job.id} className={styles.progress}>
            <div className={styles.progressLine}>
              <strong>{jobName(job)}</strong>
              {job.photoCount > 0 && <span>{formatCount(job.processedCount)} / {formatCount(job.photoCount)} · {Math.round(ratio * 100)} %</span>}
            </div>
            <ProgressBar value={ratio} label={`Export ${jobName(job)}`} height={6} />
            <span className={styles.jobMeta}>{job.status === 'pending' ? 'En attente de démarrage…' : remaining(job, now)}</span>
          </div>
        )
      })}
      {justReady.map((job) => (
        <div key={job.id} role="status" className={styles.ready}>
          <span aria-hidden="true" className={styles.readyIcon}><CheckIcon size={16} /></span>
          <span className={styles.readyText}>
            <strong>Archive prête — {jobName(job)}</strong>
            <span className={styles.jobMeta}>{plural(job.photoCount, 'photo')}{job.fileSize ? ` · ${formatBytes(job.fileSize)}` : ''}</span>
          </span>
          <a href={job.downloadUrl} className={`${buttonClass('filled')} ${styles.successButton}`} download>Télécharger</a>
        </div>
      ))}

      <h2 className={styles.heading}>Historique</h2>
      <section className={styles.card} aria-label="Historique des exports">
        {jobs === null ? (
          <p className={styles.empty}>Chargement…</p>
        ) : history.length === 0 ? (
          <p className={styles.empty}>Aucun export pour l’instant.</p>
        ) : (
          <ul className={styles.history}>
            {history.map((job) => (
              <li key={job.id} className={styles.job}>
                <span className={styles.jobText}>
                  <span className={styles.jobTitle}>{jobName(job)} — {plural(job.photoCount, 'photo')}</span>
                  <span className={styles.jobMeta}>{formatDateTime(job.finishedAt ?? job.createdAt)}{job.fileSize ? ` · ${formatBytes(job.fileSize)}` : ''}</span>
                </span>
                {job.status === 'ready' ? (
                  <>
                    <span className={`${styles.badge} ${styles.badgeReady}`}>Prête</span>
                    <a href={job.downloadUrl} className={styles.link} download>Télécharger</a>
                  </>
                ) : (
                  <>
                    <span className={`${styles.badge} ${styles.badgeFailed}`}>Échec</span>
                    <button type="button" className={styles.link} disabled={busy} onClick={() => void create(job.authorId)}>Relancer</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {error && <Toast tone="alert" message={error} onDismiss={() => setError(null)} />}
    </div>
  )
}
