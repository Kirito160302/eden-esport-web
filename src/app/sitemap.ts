import type { MetadataRoute } from "next";
import { getTeams, getPlayers, getEvents, getArticles, getProducts } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://edenesport.fr";

  const staticPaths = [
    "", "/eden", "/esport", "/equipes", "/joueurs", "/evenements", "/actions",
    "/services/organisation", "/services/ateliers", "/services/consulting",
    "/notre-equipe", "/actualites", "/blog", "/boutique", "/panier",
    "/partenaires", "/presse", "/galerie", "/rejoindre", "/benevole",
    "/contact", "/faq", "/legal/mentions", "/legal/confidentialite",
    "/legal/cgv", "/legal/cookies",
  ];

  const [teams, players, events, articles, products] = await Promise.all([
    getTeams(), getPlayers(), getEvents(), getArticles(), getProducts(),
  ]);

  const dynamic = [
    ...teams.map((t) => `/equipes/${t.slug}`),
    ...players.map((p) => `/joueurs/${p.slug}`),
    ...events.map((e) => `/evenements/${e.slug}`),
    ...articles.map((a) => `/actualites/${a.slug}`),
    ...products.map((p) => `/boutique/${p.slug}`),
  ];

  return [...staticPaths, ...dynamic].map((path) => ({
    url: base + path,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
