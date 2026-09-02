# MODIFICATIONS — Tiberium App

Ce document récapitule les modifications apportées au projet ainsi que les
correctifs planifiés, classés par priorité.

---

## PARTIE 1 — Modifications déjà appliquées

### 1. Erreur MongoDB `unknown operator: $oid` (critique, corrigé)
- **Fichier :** `app/api/messages/conversations/route.ts`
- **Problème :** la requête d'agrégation utilisait `{ $oid: userId }` (Extended JSON),
  qui n'est pas un opérateur MongoDB valide → erreur 500 sur `/api/messages/conversations`.
- **Correctif :** remplacé par `new mongoose.Types.ObjectId(userId)` (import `mongoose` ajouté).

### 2. WebSocket : connexion au mauvais chemin (critique, corrigé)
- **Fichiers :** `lib/websocket.ts` + `lib/websocketServer.ts`
- **Problème :** le client se connectait à `ws://localhost:3000/` alors que le serveur
  n'accepte les upgrades que sur `/ws` → échec du handshake, `onerror` immédiat,
  reconnexions infinies.
- **Correctif :** normalisation du pathname en `/ws` dans `connect()`.

### 3. WebSocket : `unhandledRejection` (corrigé)
- **Fichier :** `lib/hooks/useWebSocketMessages.ts`
- **Correctif :** ajout d'un `.catch()` sur la promesse `connect()`.

### 4. WebSocket serveur : `JWT_SECRET` lu de façon dynamique (corrigé)
- **Fichier :** `lib/websocketServer.ts`
- **Problème :** le secret était capturé au chargement du module (avant l'init Next),
  donc potentiellement vide → rejet de toutes les connexions malgré un token valide.
- **Correctif :** lecture de `process.env.JWT_SECRET` au moment du `jwt.verify`, avec
  vérification qu'il est configuré (sinon close 1011).

### 5. Redirection `/admin` vers `/login` pour un compte admin (corrigé)
- **Fichier :** `app/admin/page.tsx`
- **Problème :** course condition — `router.push('/login')` était déclenché tant que la
  donnée d'authentification n'était pas chargée (`user` null → `!isAuthenticated === true`).
- **Correctif :** prise en compte de `isLoading` (attend la résolution de l'auth avant
  toute redirection) + garde du rendu pendant le chargement.

### 6. Bouton "Paramètres" du Header redirigeait vers `/login` (corrigé)
- **Fichier :** `components/Header.tsx`
- **Correctif :** redirection adaptative : `/admin` pour un admin, `/messages` pour un
  utilisateur connecté, `/login` sinon.

### 7. Style de la page Admin (ajouté)
- **Fichiers :** `app/admin/page.tsx` + `app/globals.css`
- **Correctif :** page admin restylée dans l'ambiance du projet (fond image fixe, panneau
  sombre translucide, typographie Montserrat, badges Confirmed/Pending, boutons blancs
  pills). Styles ajoutés dans `globals.css` (`.admin-page`, `.admin-panel`, `.admin-table`, etc.).

---

## PARTIE 2 — Correctifs planifiés, par priorité (non encore appliqués)

### 🔴 CRITIQUE — Sécurité / données

- **C1. Secret JWT faible** (`.env.local:5`)
  `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production` → forger des tokens admin.
  → Générer un secret fort aléatoire (ne pas committer).

- **C2. Token en `localStorage` + cookie non sécurisé** (`lib/contexts/AuthContext.tsx:70-72`)
  JWT lisible par XSS ; cookie sans `HttpOnly`/`Secure`/`SameSite`.
  → Passer à un cookie `HttpOnly` + `Secure` + `SameSite` posé côté serveur.

- **C3. Token exposé dans l'URL WebSocket** (`lib/websocket.ts:28`, `lib/websocketServer.ts:54`)
  → Transmettre le token via `Sec-WebSocket-Protocol` (sous-protocole) au lieu de la query string.

- **C4. Messages WebSocket non persistés en base** (`lib/websocketServer.ts:136-180`)
  `handleMessageSend` relaie sans `save()` → perte de données si le REST échoue.
  → Persister le message côté serveur avant/après relais.

- **C5. REST persiste mais ne push jamais en temps réel** (`app/api/messages/route.ts:41-65`)
  `wsManager.broadcastToUser` existe (`websocketServer.ts:229-236`) mais n'est jamais appelé.
  → Brancher `broadcastToUser(receiverId, { ... })` après `message.save()`.

- **C6. Absence d'autorisation sur la lecture d'historique** (`app/api/messages/history/[userId]/route.ts:27-34`)
  N'importe quel user authentifié peut lire l'historique de n'importe qui.
  → Vérifier que le demandeur est bien l'expéditeur ou le destinataire.

### 🟠 ÉLEVÉ — Fonctionnalité / données

- **E1. Double envoi de chaque message (REST + WS)** (`app/messages/page.tsx:117-134`)
  → Unifier : envoyé via REST (persistance) + le serveur push via WS.

- **E2. Écrasement des messages live par `loadHistory`** (`app/messages/page.tsx:85-110`)
  → Fusionner/dédupliquer les messages live et l'historique REST.

- **E3. `lastMessage`/`lastTimestamp` faux dans conversations** (`app/api/messages/conversations/route.ts:44-45`)
  `$last` sans `$sort` préalable → "dernier message" arbitraire.
  → Ajouter `$sort: { timestamp: -1 }` avant le `$group`.

- **E4. `middleware.ts` : admin non protégé serveur** (`middleware.ts:4,23-24`) +
  faux-fuyant des emails admin (`app/api/auth/users/route.ts:35`)
  → Appliquer `adminPaths`, surveiller `/api` ; ne pas exposer les admins aux non-admins.

- **E5. Pas de limite de taille/contenu message** (`app/api/messages/route.ts:24,44`)
  → Rejeter les messages vides après trim + limiter la longueur.

- **E6. Comparaison ObjectId par `$lt` fragile + absence de `seen`** (`app/api/messages/conversations/route.ts:38-42`)
  + requête N+1 par conversation → `$toString` + `$lookup`.

### 🟡 MOYEN — UX / logique

- **M1. Checkbox "Se souvenir de moi" inerte** (`app/login/page.tsx:17`, `app/signup/page.tsx:97`)
- **M2. Header/Footer dupliqués dans chaque page au lieu du layout racine** (`app/layout.tsx:21-33`)
- **M3. Page `/settings` manquante** — bouton "Paramètres" sans vraie page, ~20 clés `profile_settings_*` inutilisées
- **M4. `html lang="en"` codé en dur** (`app/layout.tsx:24`) — non mis à jour au switch de langue
- **M5. Page home `'use client'` → perte SEO metadata** (`app/page.tsx:1`)
- **M6. `isConfirmed` jamais activé / contrôlé** (aucun endpoint, aucun check à la connexion)
- **M7. Reconnexion WS : sockets en double, vieux socket non fermé** (`lib/websocket.ts:30,73-87`) + heartbeat jamais nettoyé (`lib/websocketServer.ts:38-46`)
- **M8. ObjectId non validés → 500 au lieu de 400** (`app/api/messages/route.ts:32`, `app/api/auth/users/[userId]/type/route.ts:13`)

### 🟢 BAS — Hygiène / accessibilité

- **B1. Clé i18n manquante `contact_form_error_send`** (`components/ContactForm.tsx:63,67`) — clé brute affichée
- **B2. Typo "Acceuil"→"Accueil"** + textes EN dans le fichier FR (`locales/fr/translation.json`)
- **B3. Bouton "View Profile" du tableau admin sans action** (`app/admin/page.tsx`)
- **B4. Absence de balises sémantiques (`main`/`nav`) et de pages 404/error**
- **B5. Inputs sans `<label>`, menu sans `aria-expanded`, boutons `<div>` non accessibles clavier**
- **B6. Dépendance `axios` inutilisée**, 37 `console.*`, copyright "2024" codé en dur, imports `React` inutiles
