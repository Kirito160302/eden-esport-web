// ============================================================
//  DONNÉES DE LA PAGE ESPORT (par jeu)
//  → Facile à modifier ici. Chaque jeu a : palmarès, roster,
//    calendrier et replays. (On pourra le déplacer dans WordPress plus tard.)
// ============================================================

export type Social = { label: string; url: string };
export type EPlayer = {
  slug: string;
  pseudo: string;
  name?: string;      // Prénom Nom
  role: string;
  photo?: string;     // ex: "/joueurs/nova.jpg" (déposer l'image dans public/joueurs/)
  socials?: Social[];
};
export type EMatch = {
  date: string;       // affiché, ex: "12 oct. 2026"
  iso?: string;       // pour détecter le prochain, ex: "2026-10-12"
  opponent: string;
  competition: string;
  result?: string;    // ex: "2 - 1" (laisser vide si à venir)
};
export type EReplay = { title: string; youtube: string }; // youtube = ID ou URL
export type EPalmares = { place: string; event: string; year: string };

export type EGame = {
  key: string;        // valorant | lol
  label: string;      // "Valorant"
  palmares: EPalmares[];
  roster: EPlayer[];
  calendar: EMatch[];
  replays: EReplay[];
};

export const ESPORT: EGame[] = [
  {
    key: "valorant",
    label: "Valorant",
    palmares: [
      // À compléter : { place: "1er", event: "Nom du tournoi", year: "2026" }
    ],
    roster: [
      // Effectif de démonstration — à remplacer par tes vrais joueurs.
      { slug: "nova", pseudo: "Nova", name: "—", role: "Duelist" },
      { slug: "rift", pseudo: "Rift", name: "—", role: "Initiator" },
      { slug: "warden", pseudo: "Warden", name: "—", role: "Sentinel" },
      { slug: "vex", pseudo: "Vex", name: "—", role: "Controller" },
      { slug: "ember", pseudo: "Ember", name: "—", role: "Flex" },
    ],
    calendar: [],
    replays: [],
  },
  {
    key: "lol",
    label: "League of Legends",
    palmares: [
      { place: "2ᵉ", event: "UTT Arena", year: "2025" },
      { place: "Top 10-17", event: "Gamers Assembly", year: "2026" },
    ],
    roster: [
      { slug: "solar", pseudo: "Solar", name: "—", role: "Top" },
      { slug: "fenrir", pseudo: "Fenrir", name: "—", role: "Jungle" },
      { slug: "oracle", pseudo: "Oracle", name: "—", role: "Mid" },
      { slug: "volt", pseudo: "Volt", name: "—", role: "ADC" },
      { slug: "muse", pseudo: "Muse", name: "—", role: "Support" },
    ],
    // Calendrier d'exemple — remplace par tes vraies dates.
    calendar: [
      { date: "12 oct. 2026", iso: "2026-10-12", opponent: "Équipe adverse", competition: "Ligue régionale" },
      { date: "26 oct. 2026", iso: "2026-10-26", opponent: "À définir", competition: "UTT Arena" },
    ],
    replays: [
      // À compléter : { title: "Eden vs Adversaire — UTT Arena", youtube: "ID_ou_URL_YouTube" }
    ],
  },
];
