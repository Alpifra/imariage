import brin from '../assets/floral/brin.svg'
import bouquet from '../assets/floral/bouquet.svg'
import semis from '../assets/floral/semis.svg'
import styles from './Floral.module.css'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const FLIPS: Record<Corner, string | undefined> = {
  'top-left': undefined,
  'top-right': 'scaleX(-1)',
  'bottom-left': 'scaleY(-1)',
  'bottom-right': 'scale(-1, -1)',
}

interface BouquetProps {
  corner: Corner
  width: number
  /** How far the bouquet overflows past the side edge, in px */
  x: number
  /** How far the bouquet overflows past the top or bottom edge, in px */
  y: number
  opacity: number
  className?: string
}

/** The parent must be positioned, clip its overflow and isolate a stacking context */
export function Bouquet({ corner, width, x, y, opacity, className }: BouquetProps) {
  const [vertical, horizontal] = corner.split('-') as ['top' | 'bottom', 'left' | 'right']

  return (
    <img
      src={bouquet}
      alt=""
      aria-hidden="true"
      className={[styles.decor, className].filter(Boolean).join(' ')}
      style={{ [vertical]: -y, [horizontal]: -x, width, opacity, transform: FLIPS[corner] }}
    />
  )
}

export function Semis({ opacity }: { opacity: number }) {
  return <div aria-hidden="true" className={`${styles.decor} ${styles.semis}`} style={{ backgroundImage: `url("${semis}")`, opacity }} />
}

export function Brin({ className }: { className?: string }) {
  return <img src={brin} alt="" aria-hidden="true" className={[styles.brin, className].filter(Boolean).join(' ')} />
}
