// ============================================================
//  PARTENAIRES D'EDEN
//  ------------------------------------------------------------
//  Pour ajouter / modifier un partenaire :
//   1. Dépose son logo dans  public/partners/  (PNG ou SVG, fond
//      transparent de préférence). Ex : public/partners/nolt.png
//   2. Renseigne "logo" avec le chemin  "/partners/nolt.png".
//      Si tu laisses logo vide (""), le nom s'affiche en toutes
//      lettres (aucune image cassée).
//   3. "url" = le site du partenaire (bouton « Découvrir »).
//   4. "tier" = "principal" | "officiel" | "technique"
// ============================================================
export type Partner = {
  name: string;
  logo?: string;        // ex: "/partners/nolt.png" (vide = affiche le nom)
  url?: string;         // site du partenaire (bouton Découvrir)
  tier?: "principal" | "officiel" | "technique";
  description: string;  // présentation affichée à côté du grand logo
};

export const PARTNERS: Partner[] = [
  {
    name: "Nolt",
    logo: "/partners/nolt.png",
    url: "https://www.wearenolt.com/",
    tier: "officiel",
    description:
      "Nolt est le 1ᵉʳ équipementier de sport éco-responsable et circulaire. Maillots et textiles personnalisés, fabriqués en Europe à partir de polyester recyclé et entièrement recyclables. Un partenaire qui habille Eden avec la même exigence que nos valeurs : la performance, sans renoncer au bon geste.",
  },
  {
    name: "Rapid 33",
    logo: "/partners/rapid33.png",
    // TODO Enzo : mets ici le vrai site de Rapid 33 (bouton « Découvrir »).
    url: "",
    tier: "officiel",
    description:
      "Rapid 33 accompagne Eden au quotidien et soutient le développement de la structure. Un partenaire local engagé à nos côtés dès les premières heures du projet.",
    // TODO Enzo : remplace cette description par la présentation exacte de Rapid 33.
  },
];
