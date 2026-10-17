// Point d'entrée unique pour récupérer le contenu.
// Chaque fonction essaie WordPress, puis retombe sur les données de démonstration.
// Les jointures (roster d'une équipe, équipe d'un joueur) sont faites ici.

import * as demo from "./demo-data";
import * as wp from "./wordpress";
import type { Team, Player, Event, Article } from "./types";
import { PRODUCTS, type ShopProduct } from "./shop-data";
import { PARTNERS, type Partner } from "./partners-data";
import { EVENTS } from "./events-data";
import { ESPORT, type EGame, type EPlayer } from "./esport-data";
import { PUBLIC_TEAMS, teamByLabel } from "./public-teams";
import { getRosterPlayers, getRosterTeams, type RosterPlayer } from "./roster-live";

// ---- Rosters gérés depuis le bureau (table bu_players) ----
function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "joueur";
}
function initialsOf(s: string): string {
  const parts = (s || "").trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (s || "?").slice(0, 2)).toUpperCase();
}
function rosterToPlayer(rp: RosterPlayer, used: Set<string>): Player {
  const t = teamByLabel(rp.team);
  let slug = slugify(rp.pseudo);
  while (used.has(slug)) slug += "-x";
  used.add(slug);
  return {
    slug, pseudo: rp.pseudo, name: rp.real_name && rp.real_name !== "—" ? rp.real_name : undefined,
    role: rp.poste || "", game: t?.game || "", gameKey: t?.gameKey || "",
    teamName: t?.name || rp.team || "", teamSlug: t?.slug || "", initials: initialsOf(rp.pseudo),
    photo: rp.photo_url || undefined,
    socials: rp.social ? [{ label: "Lien", url: rp.social }] : undefined,
  };
}
// Joueurs publics issus du bureau (vide si rien n'est encore saisi).
async function rosterPlayers(): Promise<Player[]> {
  const rows = await getRosterPlayers();
  const used = new Set<string>();
  return rows.map((r) => rosterToPlayer(r, used));
}

// Équipes & joueurs : WordPress en priorité, sinon données de démonstration.
async function rawTeams(): Promise<Team[]> {
  const wpT = await wp.wpTeams();
  return wpT && wpT.length ? wpT : demo.DEMO_TEAMS;
}
async function rawPlayers(): Promise<Player[]> {
  const wpP = await wp.wpPlayers();
  return wpP && wpP.length ? wpP : demo.DEMO_PLAYERS;
}

// Page /esport : on garde la structure riche (calendrier, palmarès, replays)
// définie dans esport-data.ts, mais si des joueurs existent dans WordPress pour
// un jeu, ils remplacent le roster de ce jeu. Sinon → roster du code.
export async function getEsportGames(): Promise<EGame[]> {
  // Priorité aux joueurs saisis dans le bureau, sinon WordPress, sinon démo.
  const roster = await rosterPlayers();
  const toE = (p: Player): EPlayer => ({ slug: p.slug, pseudo: p.pseudo, name: p.name, role: p.role, photo: p.photo, socials: p.socials });
  if (roster.length) {
    return ESPORT.map((g) => {
      const r = roster.filter((p) => p.gameKey === g.key).map(toE);
      return r.length ? { ...g, roster: r } : g;
    });
  }
  const wpP = await wp.wpPlayers();
  if (!wpP || !wpP.length) return ESPORT;
  return ESPORT.map((g) => {
    const r: EPlayer[] = wpP.filter((p) => p.gameKey === g.key)
      .map((p) => ({ slug: p.slug, pseudo: p.pseudo, name: p.name && p.name !== "—" ? p.name : undefined, role: p.role, photo: p.photo, socials: p.socials }));
    return r.length ? { ...g, roster: r } : g;
  });
}

// Les équipes publiques sont la liste canonique (5) ; les rosters viennent
// du bureau (bu_players), la bannière/slogan de bu_teams.
export async function getTeams(): Promise<Team[]> {
  const [players, metas] = await Promise.all([rosterPlayers(), getRosterTeams()]);
  // bu_teams.slug stocke l'intitulé choisi dans le bureau (= label d'équipe)
  const metaByKey = new Map(metas.map((m) => [m.slug, m]));
  return PUBLIC_TEAMS.map((t) => {
    const meta = metaByKey.get(t.label) || metaByKey.get(t.slug);
    return {
      slug: t.slug, game: t.game, gameKey: t.gameKey, name: t.name, status: t.status,
      cls: t.cls, tier: t.tier, description: meta?.tagline || t.blurb, banner: meta?.banner_url || undefined,
      roster: players.filter((p) => p.teamSlug === t.slug),
      staff: [],
    };
  });
}
export async function getTeam(slug: string): Promise<Team | null> {
  return (await getTeams()).find((t) => t.slug === slug) ?? null;
}

export async function getPlayers(): Promise<Player[]> {
  const roster = await rosterPlayers();
  if (roster.length) return roster;
  // fallback : WordPress/démo tant qu'aucun joueur n'est saisi dans le bureau
  const [players, teams] = await Promise.all([rawPlayers(), rawTeams()]);
  return players.map((p) => {
    const team = teams.find((t) => t.gameKey === p.gameKey);
    return { ...p, teamName: team?.name ?? p.teamName ?? "", teamSlug: team?.slug ?? p.teamSlug ?? "" };
  });
}
export async function getPlayer(slug: string): Promise<Player | null> {
  return (await getPlayers()).find((p) => p.slug === slug) ?? null;
}

// Affiches locales par événement : utilisées si l'événement n'a pas déjà
// une image mise en avant côté WordPress. Clé = slug de l'événement.
const EVENT_POSTERS: Record<string, string> = {
  "video-games-week-10": "/event-video-games-week.jpg",
};

// Convertit une date française affichée ("19 octobre 2026", ou "18 > 23 octobre 2026")
// en date ISO utilisable pour le compte à rebours, quand le champ dateIso n'est pas
// renseigné côté WordPress. Prend le premier jour trouvé collé au nom du mois.
const FR_MONTHS: Record<string, string> = {
  janvier: "01", "février": "02", fevrier: "02", mars: "03", avril: "04", mai: "05",
  juin: "06", juillet: "07", "août": "08", aout: "08", septembre: "09",
  octobre: "10", novembre: "11", "décembre": "12", decembre: "12",
};
export function frDateToIso(date?: string): string | undefined {
  if (!date) return undefined;
  const m = date.toLowerCase().match(/(\d{1,2})\s+([a-zàâäéèêëîïôöùûüç]+)\s+(\d{4})/i);
  if (!m) return undefined;
  const mm = FR_MONTHS[m[2]];
  if (!mm) return undefined;
  return `${m[3]}-${mm}-${m[1].padStart(2, "0")}T10:00`;
}
export async function getEvents(): Promise<Event[]> {
  const wpEv = await wp.wpEvents();
  const list = wpEv && wpEv.length ? wpEv : EVENTS;
  return list.map((e) => (e.image ? e : EVENT_POSTERS[e.slug] ? { ...e, image: EVENT_POSTERS[e.slug] } : e));
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
