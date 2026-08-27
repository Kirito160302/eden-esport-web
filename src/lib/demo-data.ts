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
  ["Qu'est-ce qu'Eden Esport ?", "Eden Esport est une association esport française (loi 1901) basée à Coutras, en Gironde. Nous construisons des équipes compétitives, organisons des événements et menons des actions auprès des jeunes autour du jeu vidéo."],
  ["Sur quels jeux Eden est-il présent ?", "Nos sections compétitives évoluent sur League of Legends et Valorant. Retrouve nos équipes, joueurs et résultats sur la page Esport."],
  ["Comment rejoindre Eden ?", "Rendez-vous sur la page « Rejoindre » pour postuler comme joueur, coach, manager, staff, créateur de contenu ou bénévole. On revient vers toi rapidement."],
  ["Eden organise-t-il des événements pour les collectivités et les entreprises ?", "Oui. Nous concevons des tournois, LAN et animations clés en main pour les collectivités, les entreprises et les associations. Écris-nous via la page Contact pour en discuter."],
  ["Proposez-vous des ateliers pour les jeunes ?", "Oui : des ateliers de découverte de l'esport, de création de contenu et de citoyenneté numérique, dans une démarche de médiation et de transmission."],
  ["Comment commander sur la boutique ?", "La boutique du site est une vitrine : tu composes ta sélection, puis tu es redirigé vers notre boutique officielle partenaire (Nolt) pour finaliser la commande, le paiement et la livraison en toute sécurité."],
  ["Comment devenir partenaire d'Eden ?", "Rendez-vous sur la page « Partenaires » puis clique sur « Devenir partenaire », ou contacte-nous directement. On construit ensemble un dispositif adapté à tes objectifs."],
  ["Où est basée l'association et où intervenez-vous ?", "Notre siège est à Coutras (Gironde). Nous intervenons partout en France pour nos événements et nos actions."],
];

export const LEGAL: Record<string, { title: string; bodyHtml: string }> = {
  mentions: {
    title: "Mentions légales",
    bodyHtml: `
<p>Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, voici les informations relatives à l'éditeur et à l'hébergement du site <strong>edenesport.fr</strong>.</p>

<h2>Éditeur du site</h2>
<p><strong>Eden Esport</strong>, association régie par la loi du 1<sup>er</sup> juillet 1901.<br>
Siège social : Coutras (33230), France<br>
SIRET : 93447423000018 — SIREN : 934 474 230<br>
Contact : <a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a></p>

<h2>Directeur de la publication</h2>
<p>Le président de l'association Eden Esport.</p>

<h2>Hébergement du site</h2>
<p>Le site est hébergé par <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.</p>
<p>Le back-office (gestion des contenus) est hébergé par <strong>IONOS SARL</strong> — 7 place de la Gare, 57200 Sarreguemines, France.</p>

<h2>Propriété intellectuelle</h2>
<p>L'ensemble des contenus présents sur ce site (textes, logos, visuels, éléments graphiques) est la propriété d'Eden Esport, sauf mention contraire (logos des partenaires, marques de jeux). Toute reproduction ou utilisation sans autorisation est interdite.</p>

<h2>Liens & marques citées</h2>
<p>Les marques et logos des partenaires, éditeurs de jeux et prestataires cités appartiennent à leurs propriétaires respectifs. Les liens externes sont fournis à titre informatif ; Eden Esport n'est pas responsable du contenu des sites tiers.</p>`,
  },
  confidentialite: {
    title: "Politique de confidentialité",
    bodyHtml: `
<p>Eden Esport accorde une grande importance à la protection de vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.</p>

<h2>Responsable du traitement</h2>
<p>Eden Esport — Coutras (33230). Contact : <a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a>.</p>

<h2>Données que nous collectons</h2>
<p>Nous collectons uniquement les données que vous nous transmettez volontairement :</p>
<ul>
<li><strong>Formulaires (contact, recrutement, bénévolat)</strong> : prénom, nom, email, téléphone (facultatif), et le contenu de votre message.</li>
<li><strong>Newsletter</strong> : votre adresse email, si vous choisissez de vous inscrire.</li>
</ul>
<p>L'acheminement des messages de nos formulaires est assuré par notre prestataire technique <strong>Web3Forms</strong>, qui transmet vos informations vers notre boîte email.</p>

<h2>Finalités &amp; base légale</h2>
<p>Vos données servent à répondre à vos demandes, traiter les candidatures et, le cas échéant, vous envoyer nos actualités. Le traitement repose sur votre consentement et sur l'intérêt légitime d'Eden Esport à communiquer avec vous.</p>

<h2>Durée de conservation</h2>
<p>Vos données sont conservées le temps nécessaire au traitement de votre demande, puis archivées ou supprimées dans un délai raisonnable (généralement 3 ans à compter du dernier contact).</p>

<h2>Destinataires</h2>
<p>Vos données sont destinées à l'équipe d'Eden Esport et à ses prestataires techniques (hébergement, acheminement des emails). Elles ne sont ni vendues ni cédées à des tiers à des fins commerciales.</p>

<h2>Boutique</h2>
<p>Les achats sont réalisés sur notre boutique officielle partenaire (Nolt). Les données de commande et de paiement y sont traitées selon la politique de confidentialité de ce partenaire.</p>

<h2>Vos droits</h2>
<p>Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données. Pour les exercer, écrivez-nous à <a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a>. Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).</p>`,
  },
  cookies: {
    title: "Gestion des cookies",
    bodyHtml: `
<p>Cette page vous informe de l'utilisation des cookies et technologies similaires sur le site edenesport.fr.</p>

<h2>Ce que nous utilisons</h2>
<p>Le site utilise un <strong>stockage local</strong> (localStorage) de votre navigateur pour une seule fonction de confort : mémoriser le contenu de votre <strong>panier</strong> de la boutique. Cette information reste sur votre appareil et n'est ni partagée ni utilisée à des fins de suivi.</p>
<p>À ce jour, le site <strong>n'utilise pas de cookies publicitaires ni de traceurs tiers</strong>.</p>

<h2>Mesure d'audience</h2>
<p>Nous utilisons <strong>Vercel Analytics</strong>, une solution de mesure d'audience <strong>respectueuse de la vie privée et sans cookie</strong> : elle comptabilise les visites de façon anonyme, sans suivre les visiteurs entre les sites et sans stocker de données personnelles identifiantes. Aucun consentement préalable n'est donc requis pour cette mesure.</p>

<h2>Gérer le stockage</h2>
<p>Vous pouvez à tout moment vider le stockage local et les cookies depuis les réglages de votre navigateur (section « Confidentialité » ou « Données de site »).</p>`,
  },
  cgv: {
    title: "Conditions générales de vente",
    bodyHtml: `
<p>Les présentes conditions encadrent la présentation des produits sur le site edenesport.fr.</p>

<h2>Une boutique-vitrine</h2>
<p>La boutique de ce site est une <strong>vitrine</strong>. Elle présente les produits Eden Esport et permet de préparer une sélection. <strong>La commande, le paiement, la production et la livraison sont assurés sur notre boutique officielle partenaire (Nolt)</strong>, vers laquelle vous êtes redirigé pour finaliser votre achat.</p>
<p>Aucun paiement n'est encaissé directement sur edenesport.fr.</p>

<h2>Prix</h2>
<p>Les prix affichés sur le site sont indiqués en euros TTC, à titre <strong>indicatif</strong>. Les prix, disponibilités et conditions applicables à votre commande sont ceux affichés sur la boutique partenaire au moment de la validation.</p>

<h2>Commande, paiement &amp; livraison</h2>
<p>La commande, le règlement sécurisé, les délais et frais de livraison ainsi que le service après-vente sont régis par les <strong>conditions générales de vente de la boutique partenaire (Nolt)</strong>, que nous vous invitons à consulter avant tout achat.</p>

<h2>Droit de rétractation &amp; retours</h2>
<p>Les modalités de rétractation et de retour applicables à votre commande sont celles de la boutique partenaire sur laquelle l'achat est finalisé.</p>

<h2>Contact</h2>
<p>Pour toute question relative à un produit ou à une commande : <a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a>.</p>`,
  },
};

export const GALLERY: [string, string][] = [
  ["Événements","Scène & lumières"],["Équipes","Roster Valorant"],["Communauté","Rassemblement"],["Backstage","Régie"],
  ["Événements","Public"],["Équipes","Roster LoL"],["Communauté","Meet-up"],["Backstage","Setup"],
  ["Événements","Tournoi"],["Équipes","Photo staff"],["Communauté","Discord IRL"],["Backstage","Coulisses"],
];
