import type { Team, Player, Event, Article, Product } from "./types";

// ⚠️ Données de DÉMONSTRATION — clairement provisoires.
// Elles s'affichent tant que WordPress n'est pas connecté (voir GUIDE-WORDPRESS.md).
// Aucune donnée n'est présentée comme un vrai résultat ou un vrai partenaire.

const rosterValorant: [string, string][] = [
  ["Nova", "Duelist"], ["Rift", "Initiator"], ["Warden", "Sentinel"], ["Vex", "Controller"], ["Ember", "Flex"],
];
const rosterLol: [string, string][] = [
  ["Solar", "Top"], ["Fenrir", "Jungle"], ["Oracle", "Mid"], ["Volt", "ADC"], ["Muse", "Support"],
];

function mkPlayers(list: [string, string][], game: string, gameKey: string, teamName: string, teamSlug: string): Player[] {
  return list.map(([pseudo, role]) => ({
    slug: pseudo.toLowerCase(),
    pseudo,
    role,
    game,
    gameKey,
    teamName,
    teamSlug,
    initials: pseudo[0],
    bio: "Profil de démonstration. La biographie complète sera renseignée via le CMS.",
  }));
}

export const DEMO_TEAMS: Team[] = [
  {
    slug: "valorant", game: "Valorant", gameKey: "valorant", name: "Eden Valorant",
    status: "En formation", cls: "valorant",
    description:
      "La section Valorant d'Eden se construit autour de la discipline tactique et de la communication. Un projet exigeant, tourné vers la progression.",
    roster: mkPlayers(rosterValorant, "Valorant", "valorant", "Eden Valorant", "valorant"),
    staff: [ { name: "Coach", role: "Head Coach" }, { name: "Manager", role: "Team Manager" } ],
  },
  {
    slug: "lol", game: "League of Legends", gameKey: "lol", name: "Eden LoL",
    status: "En formation", cls: "lol",
    description:
      "La section League of Legends d'Eden mise sur la macro, la cohésion et la vision de jeu pour se hisser au niveau des meilleurs.",
    roster: mkPlayers(rosterLol, "League of Legends", "lol", "Eden LoL", "lol"),
    staff: [ { name: "Coach", role: "Head Coach" }, { name: "Analyste", role: "Analyste" } ],
  },
];

export const DEMO_PLAYERS: Player[] = DEMO_TEAMS.flatMap((t) => t.roster);

export const DEMO_EVENTS: Event[] = [
  {
    slug: "eden-gathering", title: "Eden Gathering #01", date: "15 novembre 2026", place: "France",
    status: "upcoming", tag: "Annonce à venir",
    description:
      "Un premier grand rassemblement autour de l'esport, du gaming et de la communauté Eden : compétition, animations, rencontres et découverte.",
    program: [
      { time: "14:00", label: "Ouverture des portes & accueil" },
      { time: "15:00", label: "Tournois communautaires" },
      { time: "18:00", label: "Show-match Eden" },
      { time: "20:00", label: "Cérémonie & annonces" },
    ],
  },
  {
    slug: "eden-cup-0", title: "Eden Cup — Édition test", date: "2026", place: "En ligne",
    status: "past", tag: "Passé",
    description: "Édition de démonstration illustrant la fiche événement. Les événements réels seront ajoutés via le CMS.",
    program: [ { time: "—", label: "Programme à renseigner" } ],
  },
];

export const DEMO_ARTICLES: Article[] = [
  {
    slug: "identite-de-marque", category: "Structure", date: "22 août 2026", kind: "news",
    title: "Eden Esport dévoile sa nouvelle identité de marque",
    excerpt: "Un univers visuel premium pensé autour du symbole, de la lumière et de l'héritage.",
    bodyHtml:
      "<p>Eden Esport franchit une étape majeure avec la révélation de son identité de marque. Pensée comme un véritable héritage visuel, cette direction artistique incarne l'ambition de la structure.</p><h2>Un symbole, une promesse</h2><p>Le croissant et les ailes d'Eden forment un emblème à la fois guerrier et élégant.</p><blockquote>We do not only build teams. We build a legacy.</blockquote>",
  },
  {
    slug: "candidatures-sections", category: "Esport", date: "15 août 2026", kind: "news",
    title: "Ouverture des candidatures pour nos sections compétitives",
    excerpt: "Joueurs, coachs et managers : Eden recrute pour bâtir ses rosters Valorant et LoL.",
    bodyHtml:
      "<p>Eden ouvre les candidatures pour constituer ses premières équipes compétitives sur Valorant et League of Legends.</p><h2>Qui recherchons-nous ?</h2><p>Des joueurs motivés, des coachs exigeants et des managers organisés.</p>",
  },
  {
    slug: "ateliers-jeunesse", category: "Communauté", date: "2 août 2026", kind: "news",
    title: "Jeunesse & esport : nos premiers ateliers en préparation",
    excerpt: "Découverte, création de contenu, esprit d'équipe et citoyenneté numérique.",
    bodyHtml:
      "<p>Eden construit un programme d'actions auprès des jeunes, mêlant découverte de l'esport et transmission de valeurs.</p>",
  },
  {
    slug: "guide-debuter-valorant", category: "Guide", date: "2026", kind: "blog",
    title: "Bien débuter sur Valorant : nos conseils",
    excerpt: "Les fondamentaux pour progresser sereinement et prendre du plaisir.",
    bodyHtml: "<p>Un guide d'exemple illustrant le format éditorial long du blog Eden.</p><h2>Les bases</h2><p>Visée, communication, économie.</p>",
  },
];

export const DEMO_PRODUCTS: Product[] = [
  { slug: "maillot-eden", category: "Maillots", name: "Maillot Eden 2026", price: "59 €", image: "jersey", sizes: ["S","M","L","XL"],
    description: "Le maillot officiel de la structure. Design signature « Never Give Up », matières techniques respirantes et énergie violette." },
  { slug: "hoodie-eden", category: "Hoodies", name: "Hoodie Eden", price: "69 €", image: "symbol", sizes: ["S","M","L","XL"],
    description: "Hoodie premium en coton lourd, broderie du symbole Eden." },
  { slug: "tshirt-eden", category: "T-shirts", name: "T-shirt Eden Essential", price: "29 €", image: "symbol", sizes: ["S","M","L","XL"],
    description: "Le t-shirt essentiel Eden, coupe moderne et symbole discret." },
  { slug: "casquette-eden", category: "Accessoires", name: "Casquette Eden", price: "25 €", image: "symbol", sizes: ["Unique"],
    description: "Casquette brodée aux couleurs d'Eden." },
];

export const VALUES: [string, string][] = [
  ["Passion", "Le moteur d'Eden. On se donne à fond, avec cœur et sincérité."],
  ["Dépassement", "Toujours viser plus haut, sortir de sa zone de confort et grandir."],
  ["Stratégie", "Réfléchir, planifier et jouer collectif pour gagner intelligemment."],
  ["Respect", "Des adversaires, des coéquipiers et de la communauté. Sans exception."],
  ["Unité", "Ensemble, plus forts. Eden est une famille avant d'être une équipe."],
];

export const FAQ: [string, string][] = [
  ["Qu'est-ce qu'Eden Esport ?", "Une structure esport française qui construit des équipes compétitives, organise des événements et mène des actions auprès des jeunes."],
  ["Comment rejoindre une équipe Eden ?", "Rendez-vous sur la page Rejoindre pour postuler comme joueur, coach, manager ou staff."],
  ["Eden organise-t-il des événements pour les collectivités ?", "Oui. Nous concevons des tournois, LAN et animations clés en main pour collectivités, entreprises et associations."],
  ["Proposez-vous des ateliers pour les jeunes ?", "Oui, des ateliers de découverte, de création de contenu et de citoyenneté numérique."],
  ["Comment devenir partenaire ?", "Contactez-nous via la page Partenaires ou le formulaire de contact."],
  ["La boutique est-elle ouverte ?", "La boutique est en préparation. Les prix affichés sont indicatifs."],
];

export const LEGAL: Record<string, { title: string; bodyHtml: string }> = {
  mentions: { title: "Mentions légales", bodyHtml: "<p>Eden Esport — structure esport française. Les informations légales complètes seront renseignées ici.</p><h2>Éditeur</h2><p>Eden Esport. Contact : contact@eden-esport.fr <em>(à confirmer)</em>.</p><p><em>Contenu de démonstration.</em></p>" },
  confidentialite: { title: "Politique de confidentialité", bodyHtml: "<p>Eden Esport accorde une grande importance à la protection de vos données.</p><h2>Vos droits</h2><p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression.</p><p><em>Contenu de démonstration.</em></p>" },
  cgv: { title: "Conditions générales de vente", bodyHtml: "<p>Les présentes CGV encadrent les ventes de la boutique Eden.</p><p><em>Contenu de démonstration.</em></p>" },
  cookies: { title: "Gestion des cookies", bodyHtml: "<p>Ce site utilise des cookies pour améliorer votre expérience.</p><p><em>Contenu de démonstration.</em></p>" },
};

export const GALLERY: [string, string][] = [
  ["Événements","Scène & lumières"],["Équipes","Roster Valorant"],["Communauté","Rassemblement"],["Backstage","Régie"],
  ["Événements","Public"],["Équipes","Roster LoL"],["Communauté","Meet-up"],["Backstage","Setup"],
  ["Événements","Tournoi"],["Équipes","Photo staff"],["Communauté","Discord IRL"],["Backstage","Coulisses"],
];
