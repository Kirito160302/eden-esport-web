// ============================================================
//  BOUTIQUE EDEN — vitrine + redirection vers la boutique Nolt
//  ------------------------------------------------------------
//  Principe : le visiteur compose son panier ICI (vitrine).
//  Au moment de payer, on le renvoie vers NOTRE boutique
//  officielle (propulsée par Nolt) avec les mêmes articles.
//
//  → Pour activer la redirection, renseigne SHOP.checkoutUrl
//    (l'adresse de ta boutique Nolt). Si ta boutique est de
//    type Shopify, renseigne aussi SHOP.shopDomain et le champ
//    "externalId" de chaque produit (id de variante) : le
//    panier sera alors reconstruit à l'identique via un lien
//    Shopify (/cart/ID:QUANTITE,...).
//  → Tant que checkoutUrl est vide, le bouton de paiement
//    invite simplement à nous contacter (aucun lien cassé).
// ============================================================

export const SHOP = {
  // Adresse de ta boutique officielle (Nolt). Ex : "https://eden.wearenolt.com"
  checkoutUrl: "",
  // (Optionnel) domaine Shopify pour reconstruire le panier à l'identique.
  // Laisse vide si tu ne l'utilises pas.
  shopDomain: "",
  // Livraison offerte à partir de (en €)
  freeShippingFrom: 120,
  // Étapes expliquées au visiteur
  howItWorks: [
    { title: "Compose ton panier", text: "Parcours la collection et ajoute tes pièces avec leur taille, comme sur une vraie boutique." },
    { title: "Finalise en un clic", text: "Au paiement, on t'emmène sur notre boutique officielle avec exactement les mêmes articles dans ton panier." },
    { title: "Paiement 100 % sécurisé", text: "Ta commande et ton règlement se font sur notre boutique partenaire (propulsée par Nolt). Rien à ressaisir." },
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

// Construit un lien de paiement vers la boutique Nolt.
// - Si shopDomain + tous les externalId sont renseignés → panier Shopify reconstruit.
// - Sinon → on renvoie checkoutUrl (ou "" si non configuré).
export function buildCheckoutUrl(items: { externalId?: string; qty: number }[]): string {
  const canPermalink =
    SHOP.shopDomain && items.length > 0 && items.every((i) => i.externalId);
  if (canPermalink) {
    const parts = items.map((i) => `${i.externalId}:${i.qty}`).join(",");
    return `${SHOP.shopDomain.replace(/\/$/, "")}/cart/${parts}`;
  }
  return SHOP.checkoutUrl || "";
}
