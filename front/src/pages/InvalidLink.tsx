import { Bouquet, Brin } from '../components/Floral'
import { QrIcon } from '../components/icons'
import { COUPLE_INITIALS, COUPLE_NAMES } from '../config'
import styles from './Welcome.module.css'

export function InvalidLink() {
  return (
    <main className={styles.invalid}>
      <div className={styles.brand}>
        <div aria-hidden="true" className={styles.monogram}>{COUPLE_INITIALS}</div>
        <div className={styles.kicker}>Mariage de {COUPLE_NAMES}</div>
        <Brin />
      </div>
      <div className={styles.invalidText}>
        <h1>Ce lien ne semble pas valide</h1>
        <p>Scannez le QR code présent sur votre table pour rejoindre la galerie de {COUPLE_NAMES.replace('&', 'et')}.</p>
      </div>
      <div className={styles.qrHint}>
        <span><QrIcon /></span>
        <span>Ouvrez l'appareil photo de votre téléphone et visez le QR code.</span>
      </div>
      <Bouquet corner="top-left" width={270} x={50} y={40} opacity={0.3} />
      <Bouquet corner="bottom-right" width={270} x={60} y={50} opacity={0.3} />
    </main>
  )
}
