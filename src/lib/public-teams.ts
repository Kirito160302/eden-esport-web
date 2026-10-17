// ============================================================
//  ÉQUIPES PUBLIQUES EDEN — liste canonique affichée sur le site.
//  Les rosters (joueurs + photos) sont gérés depuis le bureau
//  (table bu_players) ; ici on ne définit que la structure stable
//  des équipes (slug de page, jeu, niveau, visuel).
//  Le champ `label` correspond exactement à l'intitulé choisi dans
//  le menu déroulant du bureau (bu_players.team / bu_teams.slug).
// ============================================================

export type PublicTeam = {
  slug: string;      // slug de la page /equipes/<slug>
  label: string;     // intitulé bureau (bu_players.team)
  name: string;      // nom affiché
  tier: string;      // niveau (Pro, Rising, Two…)
  game: string;      // "Valorant"
  gameKey: string;   // "valorant" | "lol" | "tft"
  cls: string;       // classe visuelle
  status: string;    // badge d'état par défaut
  blurb: string;     // description par défaut (si pas de slogan en base)
};

export const PUBLIC_TEAMS: PublicTeam[] = [
  { slug: "valorant-pro", label: "Valorant Pro", name: "Eden Valorant", tier: "Pro", game: "Valorant", gameKey: "valorant", cls: "valorant", status: "Roster actif", blurb: "L'équipe première Valorant d'Eden." },
  { slug: "valorant-rising", label: "Valorant Rising", name: "Eden Valorant Rising", tier: "Rising", game: "Valorant", gameKey: "valorant", cls: "valorant", status: "En formation", blurb: "La relève Valorant d'Eden." },
  { slug: "lol-pro", label: "League of Legends Pro", name: "Eden League of Legends", tier: "Pro", game: "League of Legends", gameKey: "lol", cls: "lol", status: "Roster actif", blurb: "L'équipe première League of Legends d'Eden." },
  { slug: "lol-two", label: "League of Legends Two", name: "Eden LoL Two", tier: "Two", game: "League of Legends", gameKey: "lol", cls: "lol", status: "En formation", blurb: "La seconde équipe League of Legends d'Eden." },
  { slug: "tft", label: "TFT", name: "Eden TFT", tier: "", game: "Teamfight Tactics", gameKey: "tft", cls: "tft", status: "Roster actif", blurb: "Les compétiteurs Teamfight Tactics d'Eden." },
];

export const teamByLabel = (label?: string | null): PublicTeam | null =>
  (label ? PUBLIC_TEAMS.find((t) => t.label === label) : null) ?? null;
export const teamBySlug = (slug: string): PublicTeam | null =>
  PUBLIC_TEAMS.find((t) => t.slug === slug) ?? null;
