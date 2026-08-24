import type { Article, Team, Player, Event } from "./types";
import type { ShopProduct } from "./shop-data";
import type { Partner } from "./partners-data";

// ============================================================
//  PASSERELLE WORDPRESS (WPGraphQL + ACF) — back-office IONOS
//  ------------------------------------------------------------
//  Définis la variable d'environnement WORDPRESS_API_URL
//  (ex : https://admin.edenesport.fr/graphql) dans Vercel.
//  Si elle est absente OU si une requête échoue → on renvoie
//  null → le site retombe automatiquement sur les données
//  locales (rien ne casse).
//  Les noms de champs ci-dessous DOIVENT correspondre au guide
//  de configuration WordPress (voir GUIDE-WORDPRESS-CMS.md).
// ============================================================

// Accepte plusieurs noms de variable (au cas où) + nettoie les espaces.
const API = (
  process.env.WORDPRESS_API_URL ||
  process.env.URL_API_WORDPRESS ||
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  ""
).trim();

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 }, // cache 60 s (ISR)
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) { console.error("WPGraphQL errors:", JSON.stringify(json.errors)); return null; }
    return json.data as T;
  } catch (e) {
    console.error("Échec de la requête WordPress:", e);
    return null;
  }
}

/* ----------------------------- utils ----------------------------- */
const strip = (html: string) => (html || "").replace(/<[^>]+>/g, "").trim();
const frDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};
// "HH:MM | Libellé" (une ligne par entrée)
const parsePairs = (txt: string): { time: string; label: string }[] =>
  (txt || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.indexOf("|");
    return i === -1 ? { time: "", label: line } : { time: line.slice(0, i).trim(), label: line.slice(i + 1).trim() };
  });
// "Nom | https://..." (une ligne par entrée)
const parseLinks = (txt: string): { name: string; url: string }[] =>
  (txt || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.indexOf("|");
    return i === -1 ? { name: line, url: "#" } : { name: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
  });
const csv = (txt: string): string[] => (txt || "").split(",").map((s) => s.trim()).filter(Boolean);
// Les listes déroulantes ACF remontent parfois en tableau (["news"]) → on prend la 1re valeur.
const one = (v: any): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")) as string;

export function slugifyGame(game: string): string {
  const g = (game || "").toLowerCase();
  if (g.includes("valorant")) return "valorant";
  if (g.includes("league") || g.trim() === "lol") return "lol";
  return g.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "autre";
}

/* =============================== ARTICLES (posts natifs) =============================== */
export async function wpArticles(): Promise<Article[] | null> {
  const data = await gql<{ posts: { nodes: any[] } }>(`
    query Articles {
      posts(first: 50, where: { status: PUBLISH }) {
        nodes {
          slug title date excerpt content
          categories { nodes { name } }
          articleFields { type }
        }
      }
    }`);
  if (!data?.posts?.nodes) return null;
  return data.posts.nodes.map((n) => ({
    slug: n.slug,
    title: n.title,
    date: frDate(n.date),
    category: n.categories?.nodes?.[0]?.name || "Actualité",
    excerpt: strip(n.excerpt),
    bodyHtml: n.content || "",
    kind: (one(n.articleFields?.type) === "blog" ? "blog" : "news") as "news" | "blog",
  }));
}

/* =============================== ÉQUIPES =============================== */
export async function wpTeams(): Promise<Team[] | null> {
  const data = await gql<{ teams: { nodes: any[] } }>(`
    query Teams {
      teams(first: 50) {
        nodes { slug title teamFields { game status description } }
      }
    }`);
  if (!data?.teams?.nodes) return null;
  return data.teams.nodes.map((n) => {
    const game = n.teamFields?.game || "";
    const gameKey = slugifyGame(game);
    return {
      slug: n.slug, name: n.title, game, gameKey, cls: gameKey,
      status: n.teamFields?.status || "",
      description: n.teamFields?.description || "",
      roster: [], staff: [],
    };
  });
}

/* =============================== JOUEURS =============================== */
export async function wpPlayers(): Promise<Player[] | null> {
  const data = await gql<{ players: { nodes: any[] } }>(`
    query Players {
      players(first: 100) {
        nodes { slug title playerFields { role game fullName } }
      }
    }`);
  if (!data?.players?.nodes) return null;
  return data.players.nodes.map((n) => {
    const game = n.playerFields?.game || "";
    const title = n.title || "?";
    return {
      slug: n.slug, pseudo: title,
      name: n.playerFields?.fullName || undefined,
      role: n.playerFields?.role || "",
      game, gameKey: slugifyGame(game),
      teamName: "", teamSlug: "",
      initials: title.charAt(0).toUpperCase(),
      bio: "Profil à compléter via le back-office.",
    };
  });
}

/* =============================== ÉVÉNEMENTS =============================== */
export async function wpEvents(): Promise<Event[] | null> {
  const data = await gql<{ events: { nodes: any[] } }>(`
    query Events {
      events(first: 50) {
        nodes {
          slug title
          eventFields {
            eventDate dateIso place adresse categorie eventStatus tag description
            program lienBilleterie hotels restaurants
          }
        }
      }
    }`);
  if (!data?.events?.nodes) return null;
  return data.events.nodes.map((n) => {
    const f = n.eventFields || {};
    return {
      slug: n.slug,
      title: n.title,
      date: f.eventDate || "",
      iso: f.dateIso || undefined,
      place: f.place || "",
      address: f.adresse || undefined,
      status: (one(f.eventStatus) === "past" ? "past" : "upcoming") as "upcoming" | "past",
      category: one(f.categorie) || undefined,
      tag: f.tag || "",
      description: f.description || "",
      program: parsePairs(f.program),
      ticketUrl: f.lienBilleterie || undefined,
      hotels: f.hotels ? parseLinks(f.hotels) : undefined,
      restaurants: f.restaurants ? parseLinks(f.restaurants) : undefined,
    };
  });
}

/* =============================== BOUTIQUE (produits) =============================== */
export async function wpProducts(): Promise<ShopProduct[] | null> {
  const data = await gql<{ products: { nodes: any[] } }>(`
    query Products {
      products(first: 100) {
        nodes {
          slug title
          featuredImage { node { sourceUrl } }
          productFields { category price ancienPrix sizes description badge epuise lienNoltDuProduit imageKind }
        }
      }
    }`);
  if (!data?.products?.nodes) return null;
  const num = (v: any) => parseFloat(String(v ?? "").replace(",", ".")) || 0;
  return data.products.nodes.map((n) => {
    const f = n.productFields || {};
    const sizes = csv(f.sizes);
    const old = num(f.ancienPrix);
    // vraie photo (image mise en avant) en priorité, sinon maillot/symbole
    const photo = n.featuredImage?.node?.sourceUrl;
    return {
      slug: n.slug,
      name: n.title,
      category: one(f.category) || "accessoires",
      price: num(f.price),
      oldPrice: old > 0 ? old : undefined,
      image: photo || (one(f.imageKind) === "jersey" ? "jersey" : "symbol"),
      sizes: sizes.length ? sizes : ["Unique"],
      description: f.description || "",
      badge: f.badge || undefined,
      soldOut: !!f.epuise,
      buyUrl: f.lienNoltDuProduit || undefined,
    };
  });
}

/* =============================== PARTENAIRES =============================== */
export async function wpPartners(): Promise<Partner[] | null> {
  const data = await gql<{ partners: { nodes: any[] } }>(`
    query Partners {
      partners(first: 50) {
        nodes {
          title
          featuredImage { node { sourceUrl } }
          partnerFields { url tier description }
        }
      }
    }`);
  if (!data?.partners?.nodes) return null;
  return data.partners.nodes.map((n) => {
    const f = n.partnerFields || {};
    const tierRaw = one(f.tier);
    const tier = (["principal", "officiel", "technique"].includes(tierRaw) ? tierRaw : "officiel") as Partner["tier"];
    return {
      name: n.title,
      logo: n.featuredImage?.node?.sourceUrl || "",
      url: f.url || "",
      tier,
      description: f.description || "",
    };
  });
}
