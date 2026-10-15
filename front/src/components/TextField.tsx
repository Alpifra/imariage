import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './TextField.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, ...props }: TextFieldProps) {
  const id = useId()

  return (
    <div className={[styles.field, error && styles.invalid].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input id={id} className={styles.input} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <span id={`${id}-error`} className="visually-hidden">{error}</span>}
    </div>
  )
}

/** Fields stacked in one grey block, separated by a hairline (mobile forms) */
export function FieldGroup({ children }: { children: ReactNode[] }) {
  return (
    <div className={styles.group}>
      {children.map((child, index) => (
        <div key={index}>
          {index > 0 && <div className={styles.separator} />}
          {child}
        </div>
      ))}
    </div>
  )
}

export function FieldError({ children }: { children: ReactNode }) {
  return <div className={styles.error} role="alert">{children}</div>
}
