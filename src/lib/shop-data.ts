// ============================================================
//  BOUTIQUE EDEN — vitrine + redirection vers la boutique Nolt
//  ------------------------------------------------------------
//  Principe : le visiteur compose sa SÉLECTION ICI (vitrine).
//  Quand il veut commander, on le renvoie vers NOTRE boutique
//  officielle Nolt, où il configure, commande et paie.
//
//  ⚠️ Nolt (NOLT ONE) est un configurateur, pas un Shopify :
//    on ne peut PAS transférer le panier automatiquement. On
//    redirige donc simplement vers la boutique Nolt.
//
//  → Renseigne SHOP.checkoutUrl avec l'adresse de TA boutique
//    Nolt quand elle sera créée (remplace le lien d'exemple).
//  → Si un jour chaque produit Nolt a sa propre URL, tu peux
//    remplir "buyUrl" par produit pour un lien direct.
// ============================================================

export const SHOP = {
  // Adresse de ta boutique officielle (Nolt). Remplace par la TIENNE quand elle sera créée.
  // (Ici : lien d'exemple d'une boutique Nolt, en attendant la boutique Eden.)
  checkoutUrl: "https://eden-esport.wearenolt.com/public/shops/bfaf0ae0-1bf8-43a1-829d-88940a151ec9",
  // Étapes expliquées au visiteur
  howItWorks: [
    { title: "Compose ta sélection", text: "Parcours la collection et ajoute les pièces qui te plaisent, avec leur taille — comme une liste d'envies." },
    { title: "Direction la boutique officielle", text: "Quand tu es prêt·e, on t'emmène sur notre boutique officielle Nolt pour passer commande." },
    { title: "Commande & paiement sur Nolt", text: "Tu choisis, personnalises et règles directement sur notre boutique Nolt. Production et livraison assurées par Nolt." },
  ] as { title: string; text: string }[],
};

export type ShopProduct = {
  slug: string;
  name: string;
  category: string;        // doit correspondre à une CATEGORIES.key
  price: number;           // en € (pour le calcul du panier)
  oldPrice?: number;       // prix barré (promo) — optionnel
  image: string;           // "jersey" | "symbol" | "/chemin/vers/image.jpg"
  sizes: string[];
  description: string;
  badge?: string;          // "Nouveau", "Édition limitée"... — optionnel
  soldOut?: boolean;
  externalId?: string;     // id de variante Shopify (pour reconstruire le panier) — optionnel
  buyUrl?: string;         // lien direct du produit sur la boutique Nolt — optionnel
};

// Catégories (ordre d'affichage dans la boutique)
export const CATEGORIES: { key: string; label: string }[] = [
  { key: "maillots", label: "Maillots" },
  { key: "hoodies", label: "Hoodies & Sweats" },
  { key: "tshirts", label: "T-shirts" },
  { key: "accessoires", label: "Accessoires" },
];

// ------------------------------------------------------------
//  PRODUITS  (ajoute / modifie librement — prix en €)
//  Les produits marqués soldOut apparaissent en "épuisé".
// ------------------------------------------------------------
export const PRODUCTS: ShopProduct[] = [
  {
    slug: "maillot-eden-2026",
    name: "Maillot officiel Eden 2026",
    category: "maillots",
    price: 59,
    image: "jersey",
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "Édition officielle",
    description:
      "Le maillot officiel de la saison 2026, floqué « Never Give Up » dans le dos. Coupe esport, tissu technique éco-responsable signé Nolt.",
  },
  {
    slug: "maillot-pro-eden-2026",
    name: "Maillot Pro Eden — Édition joueur",
    category: "maillots",
    price: 69,
    image: "jersey",
    sizes: ["S", "M", "L", "XL"],
    badge: "Édition limitée",
    description:
      "La version portée par nos joueurs en compétition. Finitions premium et personnalisation possible avec ton pseudo.",
  },
  {
    slug: "hoodie-eden",
    name: "Hoodie Eden Legacy",
    category: "hoodies",
    price: 69,
    image: "symbol",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Sweat à capuche premium, symbole Eden brodé. Molleton épais et confortable pour porter l'héritage au quotidien.",
  },
  {
    slug: "sweat-crewneck-eden",
    name: "Sweat Crewneck Eden",
    category: "hoodies",
    price: 55,
    image: "symbol",
    sizes: ["S", "M", "L", "XL"],
    description:
      "Sweat col rond sobre et élégant, logo brodé au cœur. Une pièce essentielle de la garde-robe Eden.",
  },
  {
    slug: "tshirt-eden-essential",
    name: "T-shirt Eden Essential",
    category: "tshirts",
    price: 29,
    image: "symbol",
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "Nouveau",
    description:
      "Le t-shirt signature, coton bio. Coupe droite, symbole Eden imprimé. La base parfaite aux couleurs de la structure.",
  },
  {
    slug: "tshirt-legacy",
    name: "T-shirt « Build a Legacy »",
    category: "tshirts",
    price: 32,
    image: "symbol",
    sizes: ["S", "M", "L", "XL"],
    description:
      "Notre signature « We do not only build teams. We build a legacy. » sur un t-shirt coton bio.",
  },
  {
    slug: "casquette-eden",
    name: "Casquette Eden",
    category: "accessoires",
    price: 25,
    image: "symbol",
    sizes: ["Unique"],
    description:
      "Casquette brodée du symbole Eden, réglable. La touche finale pour compléter ta tenue.",
  },
  {
    slug: "mousepad-eden",
    name: "Tapis de souris XXL Eden",
    category: "accessoires",
    price: 24,
    image: "symbol",
    sizes: ["XXL (90×40 cm)"],
    description:
      "Tapis de souris grand format, surface micro-texturée pour un contrôle précis. Aux couleurs d'Eden.",
  },
];

// Lien vers la boutique Nolt officielle (Nolt ne permet pas de transférer
// un panier depuis l'extérieur : on redirige donc vers la boutique).
export function checkoutUrl(): string {
  return SHOP.checkoutUrl || "";
}
