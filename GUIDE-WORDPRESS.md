# GUIDE — Installer le back-office WordPress sur IONOS

Objectif : gérer le contenu du site (équipes, joueurs, événements, actus,
partenaires, produits) depuis un WordPress hébergé sur IONOS, sans toucher au
code. Le site Next.js va lire ce contenu automatiquement.

> Ce guide est technique par endroits. Prends ton temps, étape par étape.
> Si tu bloques, note où et on le fait ensemble.

---

## Étape 1 — Prendre un hébergement WordPress chez IONOS

1. Sur ton compte IONOS, ajoute un **Hébergement Web** (ou une offre
   **WordPress Hosting**) — en plus du domaine que tu possèdes déjà.
2. Choisis d'installer **WordPress** (IONOS propose une installation en 1 clic).
3. Idéalement, fais pointer un sous-domaine **`admin.eden-esport.fr`** vers ce
   WordPress (le site public restera sur `eden-esport.fr`). Le back-office ne
   sera visible que par toi.

## Étape 2 — Installer les extensions

Dans WordPress → **Extensions → Ajouter**, installe et active :

- **WPGraphQL** — expose ton contenu au site Next.js (indispensable).
- **Advanced Custom Fields (ACF)** — pour ajouter des champs personnalisés.
- **WPGraphQL for ACF** — rend les champs ACF disponibles dans l'API.
- **Custom Post Type UI** — pour créer les types « Équipe », « Événement »…

## Étape 3 — Créer les types de contenu (CPT)

Avec **Custom Post Type UI**, crée ces types (coche « Show in GraphQL » et
renseigne les noms GraphQL indiqués) :

| Type       | Slug     | GraphQL (singulier / pluriel) |
|------------|----------|-------------------------------|
| Équipe     | `team`   | `team` / `teams`              |
| Joueur     | `player` | `player` / `players`          |
| Événement  | `event`  | `event` / `events`            |
| Produit    | `product`| `product` / `products`        |

Les **articles** utilisent les articles WordPress natifs (aucun CPT à créer).

## Étape 4 — Ajouter les champs (ACF)

Exemple pour « Équipe » (groupe de champs ACF, « Show in GraphQL » activé) :

- `game` (texte) — ex. « Valorant »
- `status` (texte) — ex. « En formation »
- `description` (zone de texte)
- `roster` (relation vers « Joueur ») ou champ répéteur (pseudo, rôle)
- `staff` (répéteur : nom, rôle)

Pour « Événement » : `date`, `place`, `status`, `description`, `program`
(répéteur : heure, intitulé).
Pour « Produit » : `category`, `price`, `sizes`, `description`, `image`.

> Les noms de champs doivent correspondre au code (`src/lib/wordpress.ts`).
> On peut les ajuster ensemble une fois tes CPT créés.

## Étape 5 — Récupérer l'adresse de l'API

Une fois WPGraphQL actif, ton API est à :

```
https://admin.eden-esport.fr/graphql
```

Teste-la : WordPress → **GraphQL → GraphiQL IDE**, lance une requête simple
(ex. `{ posts { nodes { title } } }`). Si tu vois tes articles, c'est bon.

## Étape 6 — Connecter le site

Dans le projet, crée un fichier `.env` (copie de `.env.example`) :

```
WORDPRESS_API_URL=https://admin.eden-esport.fr/graphql
```

Au prochain build/déploiement, le site utilisera WordPress au lieu des données
de démonstration. Le site se rafraîchit automatiquement ~60 s après chaque
publication dans WordPress.

## Étape 7 — Créer ton contenu

Dans WordPress : ajoute tes vraies équipes, joueurs, événements, articles et
produits. Clique « Publier ». Le site public se met à jour tout seul.

---

## À retenir

- Le back-office WordPress est **sur IONOS**, sur ton domaine.
- Le design (Next.js) ne change pas quand tu modifies le contenu.
- Pense à faire les **mises à jour** de WordPress et des extensions
  régulièrement (sécurité).
