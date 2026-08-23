# Eden Esport — Site web (Next.js + WordPress headless)

Site officiel d'Eden Esport. Le **design** est en Next.js (React), le **contenu**
se gère depuis un back-office **WordPress** hébergé sur IONOS (via WPGraphQL).

Tant que WordPress n'est pas connecté, le site fonctionne avec des **données de
démonstration** (dossier `src/lib/demo-data.ts`). Rien n'est cassé : tu peux le
lancer et le déployer immédiatement, puis brancher WordPress ensuite.

## Lancer en local (pour un développeur)

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

Node 18+ requis.

## Structure

```
src/
  app/                 → les pages (routing par dossier)
    page.tsx           → accueil
    eden/ esport/ ...  → pages
    equipes/[slug]/    → page dynamique (une par équipe)
  components/          → Header, Footer, cartes, effets, formulaires
  lib/
    types.ts           → modèle de contenu
    demo-data.ts       → DONNÉES DE DÉMONSTRATION (à remplacer par WordPress)
    wordpress.ts       → connexion WPGraphQL
    content.ts         → récupère le contenu (WordPress sinon démo)
public/                → images (symbole, maillot, image de partage)
```

## Connecter WordPress

Voir **GUIDE-WORDPRESS.md**. En résumé : installe WordPress + l'extension
WPGraphQL sur IONOS, puis renseigne l'URL dans `.env` :

```
WORDPRESS_API_URL=https://admin.eden-esport.fr/graphql
```

## Mettre en ligne

Voir **GUIDE-DEPLOIEMENT.md** (GitHub + IONOS Deploy Now / Vercel + domaine).

## Données provisoires à remplacer

Rosters, événements, articles, prix, partenaires : tout est signalé comme
« démonstration » dans l'interface. Aucun faux résultat ni faux partenaire.
