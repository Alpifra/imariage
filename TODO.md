# TODO — iMariage

Suivi d'avancement. Référence : [presentation.md](presentation.md).

## Phase 0 — Cadrage
- [ ] Répondre aux questions ouvertes (§10 du cahier des charges) — reste : date / nombre de convives, couleurs / visuel d'accueil
- [x] Valider les points marqués **[À valider]**
- [x] Choisir l'hébergement (VPS)
- [ ] Choisir le sous-domaine
- [ ] Récupérer l'identité visuelle (prénoms, couleurs, visuel d'accueil)

## Phase 1 — Mise en place
- [x] Initialiser le dépôt git du projet
- [x] Environnement Docker (PHP, MariaDB, Caddy, Node) + Makefile
- [x] Service worker Messenger (`make worker` pour le redémarrer après une modification)
- [x] Projet Symfony + API Platform (`/api`)
- [x] Projet React + TypeScript + Vite (`/front`)
- [x] Lint / formatage (PHP-CS-Fixer, PHPStan côté API ; oxlint côté front) — `make lint`, `make fix`, `make analyse`
- [x] Vérifier le support HEIC d'Imagick dans l'image Docker
- [ ] Ajouter un remote au dépôt git

## Phase 2 — Backend
- [x] Entités `User` (rôles guest / admin), `Device`, `Photo`, `Export` + migrations
- [x] Création de convive ou rattachement (nom normalisé + confirmation) + génération du jeton d'appareil (hash stocké)
- [x] Authentificateur par jeton d'appareil
- [x] Endpoint d'upload de photo (validation MIME, taille)
- [x] Traitement async : conversion HEIC, orientation EXIF, miniatures, date EXIF
- [x] Stockage via Flysystem
- [ ] Liste paginée des photos (+ filtre par convive)
- [ ] Suppression d'une photo (auteur ou admin)
- [ ] Authentification admin + commande de création de compte
- [ ] Rate limiting (upload fait, login à faire)
- [ ] Export ZIP asynchrone en streaming
- [x] Protection d'accès par code d'événement
- [ ] Tests fonctionnels API

## Phase 3 — Frontend convive
- [ ] Écran d'accueil + formulaire Prénom / Nom
- [ ] Persistance de l'identité sur l'appareil
- [ ] Upload multiple avec file d'attente, progression et retry
- [ ] Galerie en grille avec chargement progressif
- [ ] Lightbox plein écran (swipe)
- [ ] Filtre « Mes photos » + suppression de ses photos
- [ ] Rafraîchissement automatique des nouvelles photos

## Phase 4 — Frontend admin
- [ ] Page de connexion
- [ ] Galerie admin avec sélection multiple et suppression
- [ ] Filtre par convive
- [ ] Lancement et téléchargement de l'export

## Phase 5 — Finitions
- [ ] Habillage graphique aux couleurs du mariage
- [ ] `noindex` / `robots.txt`
- [ ] Tests sur vrais appareils (iPhone / Android), y compris en réseau dégradé
- [ ] Génération du QR code

## Phase 6 — Mise en production
- [ ] Déploiement + HTTPS
- [ ] Sauvegardes automatiques des photos et de la base
- [ ] Test de charge (envois simultanés)
- [ ] Répétition générale avant le jour J
- [ ] Suivi pendant la soirée

## Après le mariage
- [ ] Export final remis aux mariés
- [ ] Suppression des données à l'échéance convenue
