import type { ButtonProps } from './Button'
import styles from './Button.module.css'

/** Button styling for links that navigate */
export const buttonClass = (variant: ButtonProps['variant'] = 'filled', block = false) =>
  [styles.button, styles[variant], block && styles.block].filter(Boolean).join(' ')
