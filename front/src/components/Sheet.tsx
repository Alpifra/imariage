import { useEffect, useId, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './Sheet.module.css'

function useEscape(onClose: () => void) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  }, [onClose])
}

export interface SheetAction {
  label: string
  icon?: ReactNode
  tone?: 'default' | 'danger'
  onSelect: () => void
}

interface ActionSheetProps {
  title: string
  description?: string
  actions: SheetAction[]
  onCancel: () => void
  role?: 'dialog' | 'alertdialog'
}

export function ActionSheet({ title, description, actions, onCancel, role = 'dialog' }: ActionSheetProps) {
  const id = useId()
  useEscape(onCancel)

  return (
    <div className={styles.scrim} onClick={onCancel}>
      <div role={role} aria-modal="true" aria-labelledby={id} className={styles.actionSheet} onClick={(event) => event.stopPropagation()}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 id={id} className={description ? styles.strongTitle : styles.title}>{title}</h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={[styles.action, action.icon && styles.withIcon, action.tone === 'danger' && styles.danger].filter(Boolean).join(' ')}
              onClick={action.onSelect}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.cancel} onClick={onCancel} autoFocus>Annuler</button>
      </div>
    </div>
  )
}

interface BottomSheetProps {
  labelledBy: string
  children: ReactNode
}

export function BottomSheet({ labelledBy, children }: BottomSheetProps) {
  return (
    <div className={styles.scrim}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={styles.bottomSheet}>
        <div aria-hidden="true" className={styles.grabber} />
        {children}
      </div>
    </div>
  )
}

interface DialogProps {
  title: string
  description: string
  confirmLabel: string
  tone?: 'default' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({ title, description, confirmLabel, tone = 'default', busy = false, onConfirm, onCancel }: DialogProps) {
  const id = useId()
  useEscape(onCancel)

  return (
    <div className={`${styles.scrim} ${styles.centered}`} onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby={id} aria-describedby={`${id}-desc`} className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <h2 id={id} className={styles.dialogTitle}>{title}</h2>
        <p id={`${id}-desc`} className={styles.description}>{description}</p>
        <div className={styles.dialogActions}>
          <Button variant="text" size="small" onClick={onCancel} autoFocus>Annuler</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'filled'} size="small" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
