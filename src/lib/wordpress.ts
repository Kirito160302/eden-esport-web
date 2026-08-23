import type { Article, Team, Player, Event, Product } from "./types";

// Passerelle vers le back-office WordPress (WPGraphQL) sur IONOS.
// Si WORDPRESS_API_URL n'est pas défini → renvoie null → le site retombe sur les données de démo.

const API = process.env.WORDPRESS_API_URL;

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
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

const strip = (html: string) => (html || "").replace(/<[^>]+>/g, "").trim();
const frDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};

export function slugifyGame(game: string): string {
  const g = (game || "").toLowerCase();
  if (g.includes("valorant")) return "valorant";
  if (g.includes("league") || g.trim() === "lol") return "lol";
  return g.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "autre";
}

// --- ARTICLES : articles WordPress natifs ---
export async function wpArticles(): Promise<Article[] | null> {
  const data = await gql<{ posts: { nodes: any[] } }>(`
    query Articles {
      posts(first: 24, where: { status: PUBLISH }) {
        nodes { slug title date excerpt content categories { nodes { name } } }
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
    kind: "news" as const,
  }));
}

// --- ÉQUIPES (le roster est rattaché dans content.ts) ---
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
      slug: n.slug,
      name: n.title,
      game,
      gameKey,
      cls: gameKey,
      status: n.teamFields?.status || "",
      description: n.teamFields?.description || "",
      roster: [],
      staff: [],
    };
  });
}

// --- JOUEURS (teamName / teamSlug complétés dans content.ts) ---
export async function wpPlayers(): Promise<Player[] | null> {
  const data = await gql<{ players: { nodes: any[] } }>(`
    query Players {
      players(first: 100) {
        nodes { slug title playerFields { role game teamSlug fullName } }
      }
    }`);
  if (!data?.players?.nodes) return null;
  return data.players.nodes.map((n) => {
    const game = n.playerFields?.game || "";
    const title = n.title || "?";
    return {
      slug: n.slug,
      pseudo: title,
      name: n.playerFields?.fullName || undefined,
      role: n.playerFields?.role || "",
      game,
      gameKey: slugifyGame(game),
      teamName: "",
      teamSlug: "",
      initials: title.charAt(0).toUpperCase(),
      bio: "Profil à compléter via le back-office.",
    };
  });
}

// --- ÉVÉNEMENTS ---
export async function wpEvents(): Promise<Event[] | null> {
  const data = await gql<{ events: { nodes: any[] } }>(`
    query Events {
      events(first: 50) {
        nodes { slug title eventFields { eventDate place eventStatus tag description program } }
      }
    }`);
  if (!data?.events?.nodes) return null;
  return data.events.nodes.map((n) => {
    const f = n.eventFields || {};
    const program = (f.program || "").split("\n").map((l: string) => l.trim()).filter(Boolean).map((line: string) => {
      const idx = line.indexOf("|");
      return idx === -1 ? { time: "", label: line } : { time: line.slice(0, idx).trim(), label: line.slice(idx + 1).trim() };
    });
    return {
      slug: n.slug,
      title: n.title,
      date: f.eventDate || "",
      place: f.place || "",
      status: (f.eventStatus === "past" ? "past" : "upcoming") as "upcoming" | "past",
      tag: f.tag || "",
      description: f.description || "",
      program,
    };
  });
}

// --- PRODUITS ---
export async function wpProducts(): Promise<Product[] | null> {
  const data = await gql<{ products: { nodes: any[] } }>(`
    query Products {
      products(first: 50) {
        nodes { slug title productFields { category price sizes imageKind description } }
      }
    }`);
  if (!data?.products?.nodes) return null;
  return data.products.nodes.map((n) => {
    const f = n.productFields || {};
    const sizes = (f.sizes || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    return {
      slug: n.slug,
      name: n.title,
      category: f.category || "Boutique",
      price: f.price || "",
      image: (f.imageKind === "jersey" ? "jersey" : "symbol") as "jersey" | "symbol",
      sizes: sizes.length ? sizes : ["Unique"],
      description: f.description || "",
    };
  });
}
