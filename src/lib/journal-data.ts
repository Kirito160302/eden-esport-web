// ============================================================
//  JOURNAL / MÉDIA — encarts sponsors de la colonne de droite
//  Ajoute tes sponsors ici (logo dans public/sponsors/ + lien).
// ============================================================
export type Sponsor = { name: string; image?: string; url?: string };

export const SPONSORS: Sponsor[] = [
  // Exemple :
  // { name: "Mon Sponsor", image: "/sponsors/logo.png", url: "https://sponsor.fr" },
];

// Les "chaînes" du média (Eden en premier, puis les jeux où Eden est présent)
// logo : dépose le logo officiel du jeu dans public/games/ (PNG fond transparent).
//        S'il est absent, on affiche une pastille colorée avec l'initiale.
export const CHANNELS: { key: string; label: string; accent?: string; logo?: string }[] = [
  { key: "eden", label: "Eden" },
  { key: "lol", label: "League of Legends", accent: "#5a8cff", logo: "/games/lol.png" },
  { key: "valorant", label: "Valorant", accent: "#ff4655", logo: "/games/valorant.png" },
];
