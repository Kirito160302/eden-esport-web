// Point d'entrée unique pour récupérer le contenu.
// Chaque fonction essaie WordPress, puis retombe sur les données de démonstration.
// Les jointures (roster d'une équipe, équipe d'un joueur) sont faites ici.

import * as demo from "./demo-data";
import * as wp from "./wordpress";
import type { Team, Player, Event, Article } from "./types";
import { PRODUCTS, type ShopProduct } from "./shop-data";
import { PARTNERS, type Partner } from "./partners-data";
import { EVENTS } from "./events-data";

async function rawTeams(): Promise<Team[]> { const w = await wp.wpTeams(); return w && w.length ? w : demo.DEMO_TEAMS; }
async function rawPlayers(): Promise<Player[]> { const w = await wp.wpPlayers(); return w && w.length ? w : demo.DEMO_PLAYERS; }

export async function getTeams(): Promise<Team[]> {
  const [teams, players] = await Promise.all([rawTeams(), rawPlayers()]);
  return teams.map((t) => ({ ...t, roster: players.filter((p) => p.gameKey === t.gameKey) }));
}
export async function getTeam(slug: string): Promise<Team | null> {
  return (await getTeams()).find((t) => t.slug === slug) ?? null;
}

export async function getPlayers(): Promise<Player[]> {
  const [players, teams] = await Promise.all([rawPlayers(), rawTeams()]);
  return players.map((p) => {
    const team = teams.find((t) => t.gameKey === p.gameKey);
    return { ...p, teamName: team?.name ?? p.teamName ?? "", teamSlug: team?.slug ?? p.teamSlug ?? "" };
  });
}
export async function getPlayer(slug: string): Promise<Player | null> {
  return (await getPlayers()).find((p) => p.slug === slug) ?? null;
}

export async function getEvents(): Promise<Event[]> {
  const wpEv = await wp.wpEvents();
  return wpEv && wpEv.length ? wpEv : EVENTS;
}
export async function getEvent(slug: string): Promise<Event | null> {
  return (await getEvents()).find((e) => e.slug === slug) ?? null;
}

export async function getArticles(kind?: "news" | "blog"): Promise<Article[]> {
  const wpArts = await wp.wpArticles();
  const all = wpArts && wpArts.length ? wpArts : demo.DEMO_ARTICLES;
  return kind ? all.filter((a) => a.kind === kind) : all;
}
export async function getArticle(slug: string): Promise<Article | null> {
  return (await getArticles()).find((a) => a.slug === slug) ?? null;
}

export async function getProducts(): Promise<ShopProduct[]> {
  const wpProds = await wp.wpProducts();
  return wpProds && wpProds.length ? wpProds : PRODUCTS;
}
export async function getProduct(slug: string): Promise<ShopProduct | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getPartners(): Promise<Partner[]> {
  const wpP = await wp.wpPartners();
  return wpP && wpP.length ? wpP : PARTNERS;
}

// Construit des options de filtre à partir des données réelles (label + valeur).
export function filterOptions(pairs: [string, string][], allLabel = "Tout"): { label: string; value: string }[] {
  const seen = new Map<string, string>();
  for (const [value, label] of pairs) if (value && !seen.has(value)) seen.set(value, label);
  return [{ label: allLabel, value: "all" }, ...Array.from(seen, ([value, label]) => ({ label, value }))];
}

export { VALUES, FAQ, LEGAL, GALLERY } from "./demo-data";
