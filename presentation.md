# iMariage — Cahier des charges

Plateforme de partage de photos pour le mariage de **Tristan et Maïwenn** : les convives déposent leurs photos du jour J (pendant la soirée ou après) et peuvent consulter celles des autres. Les mariés (admin) modèrent et récupèrent l'ensemble des photos.

> Les questions restantes sont regroupées au §10.

---

## 1. Contexte & contraintes

- **Utilisateurs** : convives, sur smartphone pour la quasi-totalité, sans compte et sans installation d'application.
- **Point d'entrée** : un QR code (cartons sur les tables, affiche) qui pointe vers l'URL de l'événement.
- **Réseau** : connexion souvent mauvaise sur le lieu de réception → les envois doivent être robustes (reprise, nouvelle tentative, progression visible).
- **Usage ponctuel** : pic de charge le soir J, puis activité faible pendant quelques semaines. La plateforme est fermée quelques semaines après le mariage, une fois l'export final remis aux mariés.
- **Photos uniquement** : pas de vidéos.
- **Langue** : français uniquement.
- **Simplicité** : un convive doit pouvoir déposer sa première photo en moins de 30 secondes après avoir scanné le QR code.

## 2. Rôles

Convives et admins sont tous des `User`, distingués par leur rôle.

| Rôle | Rôle Symfony | Authentification | Capacités |
|------|--------------|------------------|-----------|
| Convive | `ROLE_GUEST` | Nom + Prénom, rattachés à l'appareil | Déposer, voir la galerie, supprimer ses propres photos |
| Admin (mariés / organisateur) | `ROLE_ADMIN` (hérite de `ROLE_GUEST`) | Identifiant + mot de passe | Tout ce que fait un convive + supprimer n'importe quelle photo, exporter |

## 3. Fonctionnalités convive

### 3.1 Identification (Nom / Prénom)
- Au premier accès : formulaire Prénom + Nom (obligatoires).
- L'identité est mémorisée sur l'appareil : pas de nouvelle saisie aux visites suivantes.
- Possibilité de modifier son nom affiché.
- Le nom est normalisé pour la comparaison : espaces en trop retirés, insensible à la casse et aux accents (`  jean  DUPONT` = `Jean Dupont`). À l'affichage, il est remis en forme (`Jean Dupont`, `Marie-Hélène`).
- Si le nom existe déjà : « Vous avez déjà déposé des photos depuis un autre appareil ? »
  - **Oui** → l'appareil est rattaché au convive existant, qui retrouve toutes ses photos.
  - **Non** → un nouveau convive est créé (cas des homonymes).

### 3.2 Import d'images
- Sélection multiple depuis la galerie du téléphone ou prise de vue directe (`<input type="file" accept="image/*" multiple capture>`).
- Formats acceptés : JPEG, PNG, WebP, **HEIC/HEIF** (format par défaut des iPhone — à convertir côté serveur).
- Taille max par fichier : 25 Mo.
- Barre de progression par fichier, file d'attente, nouvelle tentative automatique en cas d'échec réseau.
- Pas de compression côté client : les originaux sont envoyés et conservés en pleine résolution.
- Confirmation visuelle une fois la photo en ligne.

### 3.3 Visualisation
- Galerie en grille (miniatures), triée de la plus récente à la plus ancienne.
- Chargement progressif (scroll infini / pagination).
- Vue plein écran (lightbox) avec navigation par swipe, nom de l'auteur et heure de dépôt.
- Filtre « Mes photos ».
- Rafraîchissement automatique des nouvelles photos pendant la soirée, par polling.

### 3.4 Gestion de ses photos
- Un convive peut supprimer les photos qu'il a lui-même déposées (contrôle via la signature de l'appareil).

## 4. Fonctionnalités admin

### 4.1 Connexion
- Page de login identifiant / mot de passe (mot de passe haché, Symfony Security).
- Comptes admin créés en ligne de commande (pas d'inscription publique).
- Protection contre le brute force (rate limiter Symfony).

### 4.2 Modération
- Publication immédiate : pas de validation préalable, l'admin modère a posteriori.
- Galerie admin avec sélection multiple.
- Suppression d'une ou plusieurs photos (suppression définitive du fichier + des miniatures).
- Filtre par convive.

### 4.3 Export
- Téléchargement d'une archive ZIP contenant toutes les photos (originaux).
- Rangement des photos dans le ZIP : un seul dossier, fichiers nommés par date et heure de prise de vue puis auteur (`20270612-213045_Jean-Dupont.jpg`). Trié par nom, l'ordre des fichiers suit le déroulé de la journée, et l'auteur reste visible. Sans date EXIF, on prend la date de dépôt ; en cas de doublon, on ajoute un suffixe (`_2`, `_3`…).
- Génération asynchrone (Symfony Messenger) vu le volume, avec notification ou lien de téléchargement quand l'archive est prête.
- Option : export filtré (par convive, par plage horaire).

## 5. Fonctionnalités clés (détail technique)

### 5.1 Signature numérique de l'appareil
Objectif : reconnaître un appareil sans compte, pour rattacher les photos à un convive et lui permettre de gérer les siennes.

Approche retenue :
- Au premier accès, le serveur génère un **jeton aléatoire** (256 bits) associé à l'appareil (`Device`), lui-même rattaché au `User`.
- Le jeton est stocké côté client dans un cookie `HttpOnly` `Secure` `SameSite=Lax` posé par le serveur (pas de `localStorage` : inaccessible au JavaScript, et envoyé automatiquement, y compris pour les miniatures protégées). Une fois authentifié, le convive a aussi une session.
- Côté serveur, seul un **hash** du jeton est stocké.

Pourquoi pas un « vrai » fingerprinting navigateur (canvas, user-agent, etc.) : peu fiable (identique entre iPhones du même modèle, change aux mises à jour). Le jeton aléatoire est plus simple et plus fiable.

Changement d'appareil ou navigateur vidé : quand un convive saisit un Prénom + Nom déjà connu et confirme (cf. §3.1), le nouvel appareil est rattaché au convive existant. Un convive peut donc avoir plusieurs appareils, et retrouve toutes ses photos sur chacun d'eux.

### 5.2 Import d'image (backend)
- Upload multipart vers API Platform (endpoint dédié).
- Validation : type MIME réel (pas l'extension), taille, dimensions.
- Conversion HEIC → JPEG pour l'affichage.
- Correction de l'orientation EXIF.
- Génération de miniatures (ex. 400 px et 1600 px) en asynchrone via Messenger.
- Suppression des données GPS EXIF sur les versions affichées ; conservation dans l'original pour l'export.
- Lecture de la date de prise de vue EXIF si disponible.
- Stockage via Flysystem (disque local au départ, S3-compatible possible ensuite).
- Rate limiting par appareil pour éviter les abus.

### 5.3 Affichage
- Les fichiers ne sont pas exposés publiquement de manière listable : URLs non devinables (UUID) et/ou servies derrière contrôle d'accès.
- Cache HTTP long sur les miniatures (immuables).

### 5.4 Export
Voir §4.3. Génération en streaming pour ne pas saturer la mémoire.

## 6. Accès à la plateforme

- Pour éviter qu'un inconnu tombe sur les photos : l'URL d'accès contient un **code d'événement secret** (intégré au QR code). Pas de code à saisir.
- Le code (variable d'environnement `EVENT_CODE`) n'est exigé qu'à l'identification : ensuite le cookie d'appareil suffit, et changer le code ne déconnecte pas les convives déjà identifiés.
- Pages non indexées (`noindex`, `robots.txt`).

## 7. Stack technique

| Couche | Choix | Remarque |
|--------|-------|----------|
| Front | React + TypeScript, Vite | Mobile-first, pas de PWA |
| Back | Symfony 8.1 + API Platform | PHP 8.5 |
| Base de données | MariaDB 11.4 | |
| Async | Symfony Messenger | Miniatures, export ZIP |
| Temps réel | Polling | Pas de Mercure |
| Images | Imagick (ou libvips) | Support HEIC requis |
| Stockage | Flysystem (local / S3) | |
| Auth admin | Symfony Security, session (cookie) | Front et API sur le même domaine : pas de JWT |
| Environnement | Docker (dev) | Prod : VPS, sur un sous-domaine d'un domaine existant |

### Modèle de données (première version)

- **User** : `id` (UUID), `firstName`, `lastName`, `normalizedName` (indexé, non unique à cause des homonymes), `roles` (`ROLE_GUEST` / `ROLE_ADMIN`), `username` (nullable, unique — admins uniquement), `password` (haché, nullable — admins uniquement), `createdAt`
- **Device** : `id` (UUID), `user` (→ User), `tokenHash` (unique), `createdAt`, `lastSeenAt`
- **Photo** : `id` (UUID), `author` (→ User), `originalPath`, `thumbnailPath`, `mediumPath`, `mimeType`, `size`, `width`, `height`, `takenAt` (nullable), `createdAt`, `status` (processing / ready / failed)
- **Export** : `id` (UUID), `status` (pending / processing / ready / failed), `filePath` (nullable), `createdAt`, `requestedBy` (→ User)

### Endpoints API (première version)

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/api/events/{code}` | Public (vérification du code d'événement : 200 / 404) |
| POST | `/api/guests` | Public avec code d'événement (création ou rattachement par Prénom + Nom, pose le cookie d'appareil ; 409 si le nom est déjà connu et que `sameGuest` n'est pas renseigné) |
| GET | `/api/guests/me` | Convive |
| GET | `/api/guests` · `/api/guests/{id}` | Admin (convives avec leur nombre de photos) |
| GET | `/api/album` | Convive / Admin (nombre de photos, de contributeurs, espace utilisé) |
| GET | `/api/photos` | Convive / Admin (60 par page, plus récentes d'abord ; curseurs `before` / `after` = id de photo ; filtres `mine`, `author`) |
| POST | `/api/photos` | Convive (multipart, champ `file`) |
| GET | `/api/photos/{id}` | Convive / Admin |
| GET | `/api/photos/{id}/thumbnail` · `/medium` | Convive / Admin (fichiers JPEG, cache privé immuable) |
| DELETE | `/api/photos/{id}` | Auteur / Admin |
| POST | `/api/login` · `/api/logout` | Admin (JSON `username` / `password`, session ; 5 essais / 15 min) |
| POST | `/api/exports` | Admin |
| GET | `/api/exports/{id}` | Admin |

## 8. Exigences non fonctionnelles

- **Volume estimé** : ~100 convives × ~30 photos × ~4 Mo ≈ **12 Go**, à recalculer avec le nombre de convives.
- **Performance** : galerie utilisable en 4G médiocre (miniatures légères, lazy loading).
- **Compatibilité** : Safari iOS et Chrome Android récents en priorité.
- **Sécurité** : HTTPS obligatoire, validation stricte des uploads, CSRF/CORS configurés, rate limiting.
- **Sauvegarde** : sauvegarde des photos avant / après le jour J (perte de données = inacceptable).
- **Accessibilité** : contrastes, tailles de boutons adaptées au tactile.

## 9. Hors périmètre (V1)

- Comptes convives avec email / mot de passe
- Vidéos
- Multilingue
- Likes, commentaires, réactions
- Retouche d'image
- Mode diaporama sur grand écran
- Masquer une photo sans la supprimer
- PWA (installation sur l'écran d'accueil)
- Multi-événements (une seule instance = un mariage)

## 10. Points en suspens

### Questions restantes
1. **Date du mariage** et **nombre de convives** attendus (dimensionne le stockage du VPS, cf. §8).
2. **Identité visuelle** : couleurs, visuel d'accueil.
3. **Sous-domaine** de production.
