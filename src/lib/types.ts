// Modèle de contenu Eden Esport — partagé entre les données de démo et WordPress.

export type Team = {
  slug: string;
  game: string;          // "Valorant", "League of Legends"...
  gameKey: string;       // "valorant", "lol"
  name: string;          // "Eden Valorant"
  status: string;        // "En formation", "Roster actif"...
  cls: string;           // classe visuelle (valorant | lol | soon)
  description: string;
  roster: Player[];
  staff: { name: string; role: string }[];
};

export type Player = {
  slug: string;
  pseudo: string;
  name?: string;
  role: string;          // poste
  game: string;
  gameKey: string;
  teamName: string;
  teamSlug: string;
  initials: string;
  bio?: string;
  photo?: string;                              // URL (Image mise en avant WordPress)
  socials?: { label: string; url: string }[];  // réseaux (Twitch, X, Instagram…)
};

export type Event = {
  slug: string;
  title: string;
  date: string;             // affichage, ex: "15 novembre 2026"
  iso?: string;             // pour le compte à rebours / tri, ex: "2026-11-15T20:00"
  place: string;            // lieu court, ex: "Metz"
  address?: string;         // adresse pour la carte, ex: "Parc des Expositions, Metz"
  status: "upcoming" | "past";
  category?: string;        // Tournoi | LAN | Atelier | Rassemblement | Partenaire
  tag: string;
  description: string;
  program: { time: string; label: string }[];
  ticketUrl?: string;       // lien billetterie (laisser vide = "à venir")
  hotels?: { name: string; url: string }[];
  restaurants?: { name: string; url: string }[];
};

export type Article = {
  slug: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  kind: "news" | "blog";
};

export type Product = {
  slug: string;
  category: string;      // Maillots, Hoodies, T-shirts, Accessoires
  name: string;
  price: string;
  image: "jersey" | "symbol";
  sizes: string[];
  description: string;
};

export type Partner = {
  name: string;
  tier: "principal" | "officiel" | "technique" | "institutionnel";
  logoUrl?: string;
  url?: string;
};
