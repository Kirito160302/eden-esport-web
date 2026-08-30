// ============================================================
//  DONNÉES LIVE ESPORT — PandaScore (matchs pros & tournois)
//  ------------------------------------------------------------
//  Plan gratuit "Fixtures Only" : calendriers, résultats, tournois.
//  Renseigne la variable d'environnement PANDASCORE_TOKEN dans
//  Vercel (token trouvable sur app.pandascore.co/dashboard).
//  Sans token → renvoie des tableaux vides (aucune casse).
//  Ce fichier est utilisé côté serveur uniquement : le token
//  n'est jamais exposé au navigateur.
// ============================================================

const TOKEN = (
  process.env.PANDASCORE_TOKEN ||
  process.env.PANDASCORE_API_KEY ||
  process.env.PANDASCORE ||
  ""
).trim();
const BASE = "https://api.pandascore.co";

export const LIVE_ENABLED = !!TOKEN;

async function ps<T>(path: string, revalidate: number): Promise<T | null> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(BASE + path, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) { console.error("PandaScore", path, res.status); return null; }
    return (await res.json()) as T;
  } catch (e) {
    console.error("PandaScore fetch error:", e);
    return null;
  }
}

export type LiveMatch = {
  id: number; a: string; aLogo?: string; b: string; bLogo?: string;
  league: string; time: string; live: boolean; score?: string;
};
export type LiveTournament = { id: number; name: string; league: string; dates: string };

const fmtTime = (iso?: string): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};
const fmtDate = (iso?: string): string => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); }
  catch { return ""; }
};

function mapMatch(m: any): LiveMatch {
  const ops = m.opponents || [];
  const o0 = ops[0]?.opponent || {}, o1 = ops[1]?.opponent || {};
  const res = m.results || [];
  const s0 = res.find((r: any) => r.team_id === o0.id)?.score;
  const s1 = res.find((r: any) => r.team_id === o1.id)?.score;
  const live = m.status === "running";
  const showScore = (live || m.status === "finished") && typeof s0 === "number" && typeof s1 === "number";
  return {
    id: m.id,
    a: o0.name || o0.acronym || "À déterminer", aLogo: o0.image_url || undefined,
    b: o1.name || o1.acronym || "À déterminer", bLogo: o1.image_url || undefined,
    league: [m.league?.name, m.serie?.full_name].filter(Boolean).join(" · ") || "Compétition",
    time: live ? "EN DIRECT" : fmtTime(m.begin_at || m.scheduled_at),
    live,
    score: showScore ? `${s0} – ${s1}` : undefined,
  };
}

export async function getLiveMatches(game: "lol" | "valorant"): Promise<LiveMatch[]> {
  const [running, upcoming] = await Promise.all([
    ps<any[]>(`/${game}/matches/running?per_page=5`, 120),
    ps<any[]>(`/${game}/matches/upcoming?sort=begin_at&per_page=8`, 300),
  ]);
  if (running === null && upcoming === null) return [];
  const seen = new Set<number>();
  const out: LiveMatch[] = [];
  for (const m of [...(running || []), ...(upcoming || [])]) {
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(mapMatch(m));
    if (out.length >= 6) break;
  }
  return out;
}

export async function getLiveTournaments(game: "lol" | "valorant"): Promise<LiveTournament[]> {
  const data = await ps<any[]>(`/${game}/tournaments/running?per_page=6`, 1800);
  if (!data) return [];
  return data.slice(0, 6).map((t: any) => ({
    id: t.id,
    name: t.serie?.full_name || t.league?.name || t.name || "Tournoi",
    league: t.league?.name || "",
    dates: [fmtDate(t.begin_at), fmtDate(t.end_at)].filter(Boolean).join(" → "),
  }));
}
