import type { CSSProperties } from 'react'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number
  label?: string
  height?: number
  muted?: boolean
}

export function ProgressBar({ value, label, height, muted = false }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)

  return (
    <span
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? percent : undefined}
      className={[styles.track, muted && styles.muted].filter(Boolean).join(' ')}
      style={height ? ({ '--height': `${height}px` } as CSSProperties) : undefined}
    >
      <span className={styles.bar} style={{ width: `${percent}%` }} />
    </span>
  )
}
