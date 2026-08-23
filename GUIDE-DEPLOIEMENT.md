# GUIDE — Mettre le site en ligne (Next.js sur IONOS)

Le site Next.js se déploie depuis **GitHub** vers **IONOS Deploy Now** (la brique
de IONOS faite pour Next.js). Ton domaine reste chez IONOS.

> Alternative tout aussi valable : **Vercel** (créé par les auteurs de Next.js,
> très simple, offre gratuite). Le domaine peut rester chez IONOS et pointer vers
> Vercel. Les étapes sont quasi identiques.

---

## Étape 1 — Mettre le code sur GitHub

1. Crée un compte gratuit sur https://github.com
2. Crée un nouveau dépôt (« repository »), ex. `eden-esport-web`.
3. Envoie le contenu de ce dossier dans le dépôt. En ligne de commande :

```bash
git init
git add .
git commit -m "Site Eden Esport"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/eden-esport-web.git
git push -u origin main
```

*(Ne pousse pas `node_modules` ni `.next` — c'est déjà exclu par `.gitignore`.)*

## Étape 2 — Déployer sur IONOS Deploy Now

1. Va sur https://www.ionos.com/hosting/deploy-now et connecte ton compte GitHub.
2. Choisis le dépôt `eden-esport-web`.
3. IONOS détecte **Next.js** automatiquement. Valide.
4. Dans les **variables d'environnement** du projet, ajoute (quand WordPress
   sera prêt) :
   ```
   WORDPRESS_API_URL = https://admin.eden-esport.fr/graphql
   NEXT_PUBLIC_SITE_URL = https://eden-esport.fr
   ```
   *(Tu peux déployer sans, le site tournera avec les données de démo.)*
5. Lance le déploiement. Le site est en ligne sur une URL fournie par IONOS.

À chaque `git push`, le site se reconstruit et se met à jour tout seul.

## Étape 3 — Brancher ton domaine

Dans IONOS Deploy Now → **Domaines**, associe `eden-esport.fr`.
Le certificat HTTPS (cadenas) est automatique.

Si tu utilises Vercel à la place : dans Vercel → Project → **Domains**, ajoute
`eden-esport.fr`, puis chez IONOS (registrar) crée les enregistrements DNS
indiqués par Vercel.

## Étape 4 (plus tard) — Le back-office

Suis **GUIDE-WORDPRESS.md** pour installer WordPress sur IONOS et le connecter
via la variable `WORDPRESS_API_URL`. Une fois branché, tu gères tout le contenu
depuis WordPress, sur ton domaine.

---

## Récapitulatif de l'architecture

```
   [ Toi ] --modifie--> WordPress (IONOS)  --API WPGraphQL-->  Site Next.js (IONOS Deploy Now)  --> Visiteurs
   admin.eden-esport.fr                                        eden-esport.fr
```

- Domaine : IONOS (déjà pris)
- Back-office : WordPress sur IONOS
- Site : Next.js sur IONOS Deploy Now (ou Vercel)
- Coût de départ : hébergement WordPress IONOS (quelques €/mois) + le reste gratuit
