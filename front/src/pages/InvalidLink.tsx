import { QrIcon } from '../components/icons'
import { COUPLE_INITIALS, COUPLE_NAMES } from '../config'
import styles from './Welcome.module.css'

export function InvalidLink() {
  return (
    <main className={styles.invalid}>
      <div className={styles.brand}>
        <div aria-hidden="true" className={styles.monogram}>{COUPLE_INITIALS}</div>
        <div className={styles.kicker}>Mariage de {COUPLE_NAMES}</div>
      </div>
      <div className={styles.invalidText}>
        <h1>Ce lien ne semble pas valide</h1>
        <p>Scannez le QR code présent sur votre table pour rejoindre la galerie de {COUPLE_NAMES.replace('&', 'et')}.</p>
      </div>
      <div className={styles.qrHint}>
        <span><QrIcon /></span>
        <span>Ouvrez l'appareil photo de votre téléphone et visez le QR code.</span>
      </div>
    </main>
  )
}
