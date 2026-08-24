# Guide de configuration WordPress — Eden Esport

Ce guide te permet de gérer le contenu du site **depuis WordPress**. Le site
essaie WordPress en priorité et, si un contenu n'existe pas encore, il retombe
tout seul sur les données locales — **rien ne casse** pendant que tu configures.

> ⚠️ Les **noms exacts** ci-dessous (types de contenu et champs) doivent être
> respectés à la lettre : le code du site s'y réfère précisément. Une majuscule
> ou un tiret en trop = le champ ne remonte pas.

---

## 0. Les extensions à installer (une seule fois)

Dans **Extensions → Ajouter**, installe et active :

1. **WPGraphQL** — expose le contenu en API GraphQL.
2. **Advanced Custom Fields** (ACF) — pour les champs personnalisés.
3. **WPGraphQL for Advanced Custom Fields** (WPGraphQL for ACF) — relie ACF à GraphQL.
4. **Custom Post Type UI** (CPT UI) — pour créer les types de contenu.

Vérifie ensuite que l'API répond : va sur `https://TON-ADMIN/graphql` — tu dois
voir une réponse JSON (souvent une erreur « GET non supportée », c'est normal).

---

## 1. Brancher le site sur WordPress (Vercel)

Dans **Vercel → ton projet → Settings → Environment Variables**, ajoute :

| Name | Value |
|------|-------|
| `WORDPRESS_API_URL` | `https://TON-ADMIN/graphql` |

(Remplace `TON-ADMIN` par l'adresse de ton WordPress, ex. `admin.edenesport.fr`.)

Puis **Redeploy** (onglet Deployments → ⋯ → Redeploy). Tant que cette variable
est absente, le site reste sur les données locales.

---

## 2. Les types de contenu à créer (CPT UI)

Pour chacun : **CPT UI → Add/Edit Post Types**, remplis le *slug* puis, plus bas,
la section **GraphQL** (⚠️ indispensable) et **Settings**.

| Type de contenu | Post Type Slug | GraphQL Single | GraphQL Plural | Show in GraphQL | Supports |
|---|---|---|---|---|---|
| Équipe | `team` | `team` | `teams` | **Oui** | Title |
| Joueur | `player` | `player` | `players` | **Oui** | Title |
| Événement | `event` | `event` | `events` | **Oui** | Title |
| Produit | `product` | `product` | `products` | **Oui** | Title, **Featured Image** |
| Partenaire | `partner` | `partner` | `partners` | **Oui** | Title, **Featured Image** |

> **Tu avais déjà commencé** Équipes / Joueurs / Événements / Produits : garde-les,
> il faut juste **compléter leurs champs** (section 3). Le seul type vraiment
> **nouveau à créer est « Partenaire »**.
> Pour **Produit** et **Partenaire**, coche bien **Featured Image** dans *Supports* :
> l'image (photo produit / logo partenaire) = l'**image mise en avant** de WordPress,
> pas un champ ACF.

Pour tous : **Public = True**, **Show in GraphQL = True**, et les *GraphQL Single/Plural*
exactement comme ci-dessus (tout en minuscules).

> Les **Actualités / Blog** n'ont PAS de type dédié : ce sont les **Articles**
> natifs de WordPress (menu « Articles »).

---

## 3. Les champs ACF

Pour chaque groupe : **ACF → Field Groups → Add New**. En bas de chaque groupe,
règle **Show in GraphQL = Yes** et **GraphQL Field Name** avec le nom EXACT indiqué.
Puis **Location** = « Post Type is equal to … » pour le rattacher au bon contenu.

### 3.1 Groupe « teamFields » — sur *Équipe (team)*
GraphQL Field Name : **`teamFields`**

| Label | Field Name | Type | Notes |
|---|---|---|---|
| Jeu | `game` | Text | ex. `Valorant`, `League of Legends` |
| Statut | `status` | Text | ex. `En formation`, `Roster actif` |
| Description | `description` | Textarea | |

### 3.2 Groupe « playerFields » — sur *Joueur (player)*
GraphQL Field Name : **`playerFields`**
(Le **titre** du joueur = son pseudo.)

| Label | Field Name | Type | Notes |
|---|---|---|---|
| Poste / Rôle | `role` | Text | ex. `Duelliste`, `Top` |
| Jeu | `game` | Text | doit correspondre au jeu de l'équipe |
| Nom complet | `fullName` | Text | optionnel |

### 3.3 Groupe « eventFields » — sur *Événement (event)*
GraphQL Field Name : **`eventFields`**

| Label | Field Name | Type | Déjà créé ? | Notes |
|---|---|---|---|---|
| Date (affichage) | `eventDate` | Text | ✅ existant | ex. `15 novembre 2026` |
| Lieu (court) | `place` | Text | ✅ existant | ex. `Metz` |
| Statut | `eventStatus` | Select | ✅ existant | choix : `upcoming`, `past` |
| Tag | `tag` | Text | ✅ existant | ex. `À venir`, `Édition #01` |
| Description | `description` | Textarea | ✅ existant | |
| Programme | `program` | Textarea | ✅ existant | **1 ligne par créneau** : `14:00 \| Ouverture des portes` |
| Date ISO | `iso` | Text | 🆕 à ajouter | ex. `2026-11-15T20:00` (compte à rebours) |
| Adresse | `address` | Text | 🆕 à ajouter | pour la carte, optionnel |
| Catégorie | `category` | Select | 🆕 à ajouter | choix : `Tournoi`, `LAN`, `Atelier`, `Rassemblement`, `Partenaire` |
| Lien billetterie | `ticketUrl` | Text (URL) | 🆕 à ajouter | vide = « billetterie à venir » |
| Hôtels | `hotels` | Textarea | 🆕 à ajouter | **1 ligne** : `Nom de l'hôtel \| https://lien` |
| Restaurants | `restaurants` | Textarea | 🆕 à ajouter | **1 ligne** : `Nom \| https://lien` |

> ⚠️ Tous ces champs doivent exister dans le groupe, même vides : si le code
> demande `iso` et qu'il n'existe pas du tout, la requête Événements échoue en
> entier. Crée-les (tu peux les laisser vides sur chaque événement).

> Pour `category` et `eventStatus` (Select) : dans ACF, mets les **valeurs** exactement
> comme ci-dessus (à gauche du `:` si tu utilises « valeur : libellé »).

### 3.4 Groupe « productFields » — sur *Produit (product)*
GraphQL Field Name : **`productFields`**
(Le **titre** du produit = son nom.)

| Label | Field Name | Type | Déjà créé ? | Notes |
|---|---|---|---|---|
| Catégorie | `category` | Select | ✅ existant | valeurs EXACTES : `maillots`, `hoodies`, `tshirts`, `accessoires` |
| Prix (€) | `price` | Number | ✅ existant | ex. `59` (mettre en type **Number**) |
| Tailles | `sizes` | Text | ✅ existant | séparées par des virgules : `S, M, L, XL` |
| Description | `description` | Textarea | ✅ existant | |
| Ancien prix (€) | `oldPrice` | Number | 🆕 à ajouter | optionnel (prix barré / promo) |
| Badge | `badge` | Text | 🆕 à ajouter | optionnel : `Nouveau`, `Édition limitée` |
| Épuisé | `soldOut` | True / False | 🆕 à ajouter | |
| Lien Nolt (produit) | `buyUrl` | Text (URL) | 🆕 à ajouter | optionnel, lien direct du produit sur Nolt |

**Image du produit** : pas de champ ACF — c'est l'**image mise en avant** (Featured
Image) de l'article Produit. Sans image → le symbole Eden s'affiche.

> - Les valeurs de `category` doivent être **exactement** `maillots`, `hoodies`,
>   `tshirts`, `accessoires` (minuscules, sans accent).
> - Si ton ancien champ `imageKind` existe encore, tu peux le supprimer : il n'est
>   plus utilisé.

### 3.5 Groupe « partnerFields » — sur *Partenaire (partner)*
GraphQL Field Name : **`partnerFields`**
(Le **titre** du partenaire = son nom, ex. `Nolt`.)

| Label | Field Name | Type | Notes |
|---|---|---|---|
| Site web | `url` | Text (URL) | bouton « Découvrir » |
| Niveau | `tier` | Select | valeurs : `principal`, `officiel`, `technique` |
| Description | `description` | Textarea | présentation affichée à côté du logo |

**Logo du partenaire** : pas de champ ACF — c'est l'**image mise en avant** (Featured
Image) de l'article Partenaire. Sans logo → le nom s'affiche en toutes lettres.

### 3.6 Groupe « articleFields » — sur les *Articles* natifs
GraphQL Field Name : **`articleFields`**
Location : « Post Type is equal to Post ».

| Label | Field Name | Type | Notes |
|---|---|---|---|
| Type | `type` | Select | valeurs : `news`, `blog` (par défaut `news`) |

> - **Actualités** = article avec `type = news`.
> - **Blog** = article avec `type = blog`.
> - Le **titre**, le **contenu** et l'**extrait** de l'article sont ceux de WordPress.
> - La **catégorie affichée** (ex. « Esport », « Guide ») = la catégorie WordPress de l'article.

---

## 4. Remplir le contenu

1. **Articles** (menu Articles) : titre + contenu + extrait, choisis une catégorie,
   règle le champ `type` (news/blog). Publie.
2. **Équipes / Joueurs / Événements / Produits / Partenaires** : chaque nouveau
   contenu apparaît dans son menu à gauche. Renseigne le titre + les champs ACF,
   ajoute l'image si besoin, puis **Publie**.

Le **slug** (l'URL) est généré automatiquement à partir du titre ; tu peux le
modifier dans le panneau de droite.

---

## 5. Vérifier que ça marche

- Après avoir publié quelques contenus et fait le **Redeploy** Vercel, ouvre le
  site : le contenu WordPress doit apparaître à la place des exemples.
- Le site met en cache 60 s (les changements apparaissent après ~1 min, ou après
  un nouveau Redeploy).
- Si un type de contenu reste vide côté WordPress, le site garde ses exemples
  locaux pour ce type — c'est voulu.

## Ce qui reste géré dans le code (pour l'instant)

- La page **Esport** (menu de jeux, palmarès, calendrier, replays) : structure trop
  riche pour ACF, on la migrera plus tard si tu veux.
- La **config boutique** (adresse de la boutique Nolt, texte « comment ça marche »)
  et les **encarts sponsors** de la page Actualités : dans les fichiers
  `src/lib/shop-data.ts` et `src/lib/journal-data.ts`.
- Les **valeurs, la FAQ, les mentions légales, la galerie** : `src/lib/demo-data.ts`.

Dis-moi quand tu veux qu'on en migre davantage.
