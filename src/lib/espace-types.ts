// Modèle de données de l'espace membre (voir GUIDE-ESPACE-MEMBRE.md pour le SQL)

export type Role = "player" | "staff";

export type Profile = {
  id: string;        // = auth.users.id
  pseudo: string;
  role: Role;
  team: string | null;
  poste?: string | null;      // poste en jeu (Duelist, Top…)
  rank?: string | null;       // rang (Radiant, Diamant…)
  photo_url?: string | null;  // lien photo (optionnel)
  socials?: string | null;    // "Label | url" par ligne
  bio?: string | null;
};

export type Announcement = {
  id: string;
  team: string | null;   // null = toutes les équipes
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

export type SessionType = "training" | "match";

export type Seance = {
  id: string;
  type: SessionType;
  title: string;
  starts_at: string;   // ISO
  ends_at: string | null;
  team: string | null;
  opponent: string | null;   // pour les matchs
  location: string | null;
  notes: string | null;
  created_by: string | null;
  // Résultat de match (optionnel)
  score_us?: number | null;
  score_them?: number | null;
  maps?: string | null;
  vod?: string | null;
};

// Composition d'un match : un joueur aligné, son poste, son agent/champion
export type Lineup = {
  id?: string;
  session_id: string;
  user_id: string;
  role: string | null;
  pick: string | null;      // agent / champion
  starter: boolean;         // titulaire (true) ou remplaçant (false)
  ordre: number;
};

export type Availability = {
  id: string;
  session_id: string;
  user_id: string;
  status: "yes" | "no" | "maybe";
  updated_at: string;
};
