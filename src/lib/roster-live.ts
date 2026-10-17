// ============================================================
//  ROSTERS LIVE — lit les joueurs/équipes publics depuis Supabase
//  côté serveur (clé anon publique, protégée par RLS : seules les
//  lignes is_public = true sortent). Revalidation ISR : les mises à
//  jour faites dans le bureau apparaissent sur le site en ~2 min,
//  sans redéploiement. Sans Supabase → tableaux vides (aucune casse).
// ============================================================

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const REVALIDATE = 120;

export type RosterPlayer = {
  pseudo: string; real_name: string | null; team: string | null; poste: string | null;
  photo_url: string | null; social: string | null; status: string | null; sort: number | null;
};
export type RosterTeam = { slug: string; tagline: string | null; banner_url: string | null; sort: number | null };

async function rest<T>(path: string): Promise<T[]> {
  if (!URL || !ANON) return [];
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch { return []; }
}

export async function getRosterPlayers(): Promise<RosterPlayer[]> {
  return rest<RosterPlayer>("bu_players?select=pseudo,real_name,team,poste,photo_url,social,status,sort&is_public=eq.true&order=sort.asc");
}
export async function getRosterTeams(): Promise<RosterTeam[]> {
  return rest<RosterTeam>("bu_teams?select=slug,tagline,banner_url,sort&order=sort.asc");
}
