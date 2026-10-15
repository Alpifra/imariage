import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'text' | 'danger'
  size?: 'large' | 'small'
  block?: boolean
}

export function Button({ variant = 'filled', size = 'large', block = false, className, type = 'button', ...props }: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'small' && styles.small, block && styles.block, className].filter(Boolean).join(' ')

  return <button type={type} className={classes} {...props} />
}
