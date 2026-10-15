import { Link } from 'react-router'
import { ArrowUpIcon, CheckIcon, ChevronRightIcon, PauseIcon } from '../components/icons'
import { ProgressBar } from '../components/ProgressBar'
import { overallProgress, useUploads } from './uploads'
import styles from './UploadIndicator.module.css'

export function UploadIndicator({ className }: { className?: string }) {
  const uploads = useUploads()
  if (uploads.total === 0) return null

  const { sent, total, paused, finished, failedCount } = uploads
  const state = paused ? 'paused' : finished ? (failedCount > 0 ? 'failed' : 'done') : 'uploading'
  const title = {
    uploading: `${sent} / ${total} photos envoyées`,
    paused: `Envoi en pause · ${sent} / ${total}`,
    done: sent === 1 ? '1 photo envoyée' : `${sent} photos envoyées`,
    failed: failedCount === 1 ? '1 photo n’a pas pu être envoyée' : `${failedCount} photos n’ont pas pu être envoyées`,
  }[state]
  const sub = { uploading: null, paused: 'Reprendra automatiquement', done: 'Merci pour ce partage !', failed: 'Touchez pour réessayer' }[state]

  return (
    <Link to="/envoi" aria-label={`${title}. Voir le détail de l'envoi`} className={[styles.indicator, styles[state], className].filter(Boolean).join(' ')}>
      <span className={styles.icon}>
        {state === 'uploading' && <ArrowUpIcon size={18} />}
        {state === 'paused' && <PauseIcon size={18} />}
        {state === 'done' && <CheckIcon size={18} />}
        {state === 'failed' && '!'}
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {state === 'uploading' && <ProgressBar value={overallProgress(uploads.items)} />}
        {sub && <span className={styles.sub}>{sub}</span>}
      </span>
      <ChevronRightIcon size={20} className={styles.chevron} />
    </Link>
  )
}
