import { useEffect, type ReactNode } from 'react'
import { OfflineIcon } from './icons'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  action?: { label: string; onClick: () => void }
  tone?: 'status' | 'alert'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, action, tone = 'status', onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, duration)

    return () => window.clearTimeout(timeout)
  }, [onDismiss, duration])

  return (
    <div role={tone} className={styles.toast}>
      <span className={styles.message}>{message}</span>
      {action && <button type="button" className={styles.action} onClick={action.onClick}>{action.label}</button>}
    </div>
  )
}

export function OfflineBanner({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" className={[styles.banner, className].filter(Boolean).join(' ')}>
      <OfflineIcon size={22} />
      <span><strong>{title}</strong> <span className={styles.secondary}>{children}</span></span>
    </div>
  )
}
