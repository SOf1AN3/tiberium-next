# PLAN — Rework Total & Modernisation (nouvelle identité)

**Direction artistique :** abandon du thème noir. Nouvelle identité **light & premium** :
fond clair, accent dégradé indigo→violet, typographie **Inter**, coins arrondis généreux,
ombres douces, glassmorphism subtil, micro-animations.

---

## Palette cible

| Rôle | Valeur |
|---|---|
| Fond | `#f6f7fb` |
| Surface | `#ffffff` |
| Texte | `#0f172a` / muted `#5b6270` |
| Accent | dégradé `#4f46e5 → #7c3aed` |
| Bordure | `#e5e7eb` |
| Succès / Warn / Danger | `#10b981` / `#f59e0b` / `#ef4444` |

---

## Phases d'exécution

1. **Fondation** — réécriture totale de `globals.css` :
   - Tokens clairs (couleurs, espacement, radius, ombres, transitions).
   - Reset et typographie modernes.
   - Composants de base : `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input-base`,
     `.card-panel`, `.badge`, `.skeleton`, `.section-title`, animateurs.
   - `layout.tsx` : passer de Montserrat à **Inter** (next/font).

2. **Header / Footer** :
   - Navbar sticky avec effet verre (`backdrop-filter`), logo moderne, nav clean,
     boutons connexion, menu mobile animé.
   - Footer riche : colonnes (navigation, contact, réseaux), copyright dynamique.

3. **Pages publiques** :
   - **Accueil** : hero plein écran avec dégradés + CTA + section aperçu services + stats.
   - **Services** : carte modernes avec hover-lift, lumière, modal détaillée.
   - **À propos / Expats / Contact** : refonte light cohérente (containers, accordéons,
     formulaire avec labels).

4. **Auth** : login / signup en cartes centrées modernes, labels, toggle mot de passe,
   checkbox "se souvenir de moi" fonctionnelle.

5. **Messages & Admin** : dashboard clairs modernes (chat en bulles modernes,
   tableau admin avec stat-cards), sortie de l'ancien style Tailwind gris/bleu par défaut.

6. **Accessibilité, responsif, i18n** :
   - Balises sémantiques (`main`, `nav`, `section`), focus trap, labels.
   - `lang` dynamique, fix typo FR "Acceuil"→"Accueil", clé `contact_form_error_send` ajoutée.
   - Pages 404/error stylées.