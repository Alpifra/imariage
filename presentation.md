# iMariage — Cahier des charges

Plateforme de partage de photos pour un mariage : les convives déposent leurs photos du jour J (pendant la soirée ou après) et peuvent consulter celles des autres. Les mariés (admin) modèrent et récupèrent l'ensemble des photos.

> Les éléments marqués **[À valider]** sont des propositions à confirmer. Les questions ouvertes sont regroupées en fin de document.

---

## 1. Contexte & contraintes

- **Utilisateurs** : convives, sur smartphone pour la quasi-totalité, sans compte et sans installation d'application.
- **Point d'entrée** : un QR code (cartons sur les tables, affiche) qui pointe vers l'URL de l'événement.
- **Réseau** : connexion souvent mauvaise sur le lieu de réception → les envois doivent être robustes (reprise, nouvelle tentative, progression visible).
- **Usage ponctuel** : pic de charge le soir J, puis activité faible pendant quelques semaines.
- **Simplicité** : un convive doit pouvoir déposer sa première photo en moins de 30 secondes après avoir scanné le QR code.

## 2. Rôles

| Rôle | Authentification | Capacités |
|------|------------------|-----------|
| Convive | Nom + Prénom, rattachés à l'appareil | Déposer, voir la galerie, supprimer ses propres photos |
| Admin (mariés / organisateur) | Identifiant + mot de passe | Tout ce que fait un convive + supprimer n'importe quelle photo, exporter |

## 3. Fonctionnalités convive

### 3.1 Identification (Nom / Prénom)
- Au premier accès : formulaire Prénom + Nom (obligatoires).
- L'identité est mémorisée sur l'appareil : pas de nouvelle saisie aux visites suivantes.
- Possibilité de modifier son nom affiché.

### 3.2 Import d'images
- Sélection multiple depuis la galerie du téléphone ou prise de vue directe (`<input type="file" accept="image/*" multiple capture>`).
- Formats acceptés : JPEG, PNG, WebP, **HEIC/HEIF** (format par défaut des iPhone — à convertir côté serveur).
- Taille max par fichier : **[À valider]** 25 Mo.
- Barre de progression par fichier, file d'attente, nouvelle tentative automatique en cas d'échec réseau.
- Redimensionnement / compression côté client **[À valider]** pour accélérer l'envoi (l'original reste-t-il nécessaire pour l'export ? cf. questions ouvertes).
- Confirmation visuelle une fois la photo en ligne.

### 3.3 Visualisation
- Galerie en grille (miniatures), triée de la plus récente à la plus ancienne.
- Chargement progressif (scroll infini / pagination).
- Vue plein écran (lightbox) avec navigation par swipe, nom de l'auteur et heure de dépôt.
- Filtre « Mes photos ».
- Rafraîchissement automatique des nouvelles photos pendant la soirée (polling, ou Mercure **[À valider]**).
- Bonus **[À valider]** : mode diaporama pour projection sur grand écran pendant la soirée.

### 3.4 Gestion de ses photos
- Un convive peut supprimer les photos qu'il a lui-même déposées (contrôle via la signature de l'appareil).

## 4. Fonctionnalités admin

### 4.1 Connexion
- Page de login identifiant / mot de passe (mot de passe haché, Symfony Security).
- Comptes admin créés en ligne de commande (pas d'inscription publique).
- Protection contre le brute force (rate limiter Symfony).

### 4.2 Modération
- Galerie admin avec sélection multiple.
- Suppression d'une ou plusieurs photos (suppression définitive du fichier + des miniatures).
- Filtre par convive.
- Bonus **[À valider]** : masquer une photo sans la supprimer.

### 4.3 Export
- Téléchargement d'une archive ZIP contenant toutes les photos (originaux).
- Organisation dans l'archive **[À valider]** : un dossier par convive, ou fichiers nommés `AAAAMMJJ-HHMMSS_Prenom-Nom_xxx.jpg`.
- Génération asynchrone (Symfony Messenger) vu le volume, avec notification ou lien de téléchargement quand l'archive est prête.
- Option : export filtré (par convive, par plage horaire).

## 5. Fonctionnalités clés (détail technique)

### 5.1 Signature numérique de l'appareil
Objectif : reconnaître un appareil sans compte, pour rattacher les photos à un convive et lui permettre de gérer les siennes.

Approche proposée **[À valider]** :
- Au premier accès, le serveur génère un **jeton aléatoire** (UUID v4 / 256 bits) associé au `Guest` créé.
- Le jeton est stocké côté client (`localStorage` + cookie `HttpOnly` `SameSite=Lax`) et envoyé à chaque requête.
- Côté serveur, seul un **hash** du jeton est stocké.

Pourquoi pas un « vrai » fingerprinting navigateur (canvas, user-agent, etc.) : peu fiable (identique entre iPhones du même modèle, change aux mises à jour). Le jeton aléatoire est plus simple et plus fiable.

Limite connue : si le convive vide son navigateur ou change d'appareil, il est considéré comme nouveau convive (acceptable ; l'admin peut fusionner si besoin — **[À valider]**).

### 5.2 Import d'image (backend)
- Upload multipart vers API Platform (endpoint dédié).
- Validation : type MIME réel (pas l'extension), taille, dimensions.
- Conversion HEIC → JPEG pour l'affichage.
- Correction de l'orientation EXIF.
- Génération de miniatures (ex. 400 px et 1600 px) en asynchrone via Messenger.
- Suppression des données GPS EXIF sur les versions affichées **[À valider]** ; conservation dans l'original pour l'export.
- Lecture de la date de prise de vue EXIF si disponible.
- Stockage via Flysystem (disque local au départ, S3-compatible possible ensuite).
- Rate limiting par appareil pour éviter les abus.

### 5.3 Affichage
- Les fichiers ne sont pas exposés publiquement de manière listable : URLs non devinables (UUID) et/ou servies derrière contrôle d'accès.
- Cache HTTP long sur les miniatures (immuables).

### 5.4 Export
Voir §4.3. Génération en streaming pour ne pas saturer la mémoire.

## 6. Accès à la plateforme

- Pour éviter qu'un inconnu tombe sur les photos : l'URL d'accès contient un **code d'événement secret** (intégré au QR code), ou un code à saisir **[À valider]**.
- Pages non indexées (`noindex`, `robots.txt`).

## 7. Stack technique

| Couche | Choix | Remarque |
|--------|-------|----------|
| Front | React + TypeScript, Vite | Mobile-first, PWA légère **[À valider]** |
| Back | Symfony 7 + API Platform 4 | |
| Base de données | MariaDB 11.4 | |
| Async | Symfony Messenger | Miniatures, export ZIP |
| Temps réel | Polling, ou Mercure **[À valider]** | |
| Images | Imagick (ou libvips) | Support HEIC requis |
| Stockage | Flysystem (local / S3) | |
| Auth admin | Symfony Security (session ou JWT via LexikJWTAuthenticationBundle) **[À valider]** | |
| Environnement | Docker (dev) | Hébergement prod à définir |

### Modèle de données (première version)

- **Guest** : `id` (UUID), `firstName`, `lastName`, `deviceTokenHash`, `createdAt`
- **Photo** : `id` (UUID), `guest` (→ Guest), `originalPath`, `thumbnailPath`, `mediumPath`, `mimeType`, `size`, `width`, `height`, `takenAt` (nullable), `createdAt`, `status` (processing / ready / hidden)
- **AdminUser** : `id`, `username`, `password` (haché), `roles`
- **Export** : `id`, `status`, `filePath`, `createdAt`, `requestedBy`

### Endpoints API (première version)

| Méthode | Route | Rôle |
|---------|-------|------|
| POST | `/api/guests` | Convive (création + jeton) |
| GET / PATCH | `/api/guests/me` | Convive |
| GET | `/api/photos` | Convive / Admin |
| POST | `/api/photos` | Convive |
| DELETE | `/api/photos/{id}` | Auteur / Admin |
| POST | `/api/login` | Admin |
| POST | `/api/exports` | Admin |
| GET | `/api/exports/{id}` | Admin |

## 8. Exigences non fonctionnelles

- **Volume estimé** **[À valider]** : ~100 convives × ~30 photos × ~4 Mo ≈ **12 Go** (hors vidéos).
- **Performance** : galerie utilisable en 4G médiocre (miniatures légères, lazy loading).
- **Compatibilité** : Safari iOS et Chrome Android récents en priorité.
- **Sécurité** : HTTPS obligatoire, validation stricte des uploads, CSRF/CORS configurés, rate limiting.
- **Sauvegarde** : sauvegarde des photos avant / après le jour J (perte de données = inacceptable).
- **Accessibilité** : contrastes, tailles de boutons adaptées au tactile.

## 9. Hors périmètre (V1)

- Comptes convives avec email / mot de passe
- Likes, commentaires, réactions
- Retouche d'image
- Multi-événements (une seule instance = un mariage) **[À valider]**

## 10. Questions ouvertes

1. **Vidéos** : acceptées ou non ? (impact fort sur stockage, upload et export)
2. **Date du mariage** et nombre de convives attendus ?
3. **Hébergement** : VPS, PaaS, mutualisé ? Domaine ?
4. **Qualité** : conserver les originaux en pleine résolution (recommandé pour les mariés) ou compresser à l'upload ?
5. **Modération** : publication immédiate ou validation par l'admin avant affichage ?
6. **Accès** : simple lien secret via QR code suffisant, ou code à saisir ?
7. **Identité visuelle** : prénoms des mariés, couleurs, photo d'accueil ?
8. **Durée de vie** de la plateforme après le mariage ?
9. **Langues** : français uniquement ?
