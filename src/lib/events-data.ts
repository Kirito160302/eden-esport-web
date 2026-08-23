// ============================================================
//  ÉVÉNEMENTS  — facile à éditer (éditable directement sur GitHub)
//  Chaque événement : catégorie, dates, lieu (+ adresse pour la carte),
//  programme, billetterie, et infos "se loger / se restaurer" en option.
// ============================================================
import type { Event } from "./types";

// Catégories disponibles (servent aux filtres)
export const EVENT_CATEGORIES = ["Tournoi", "LAN", "Atelier", "Rassemblement", "Partenaire"];

export const EVENTS: Event[] = [
  {
    slug: "eden-gathering",
    title: "Eden Gathering #01",
    category: "Rassemblement",
    date: "15 novembre 2026",
    iso: "2026-11-15T18:00",
    place: "France",
    address: "Paris, France", // exemple — mets l'adresse réelle du lieu
    status: "upcoming",
    tag: "Annonce à venir",
    description:
      "Un premier grand rassemblement autour de l'esport, du gaming et de la communauté Eden : compétition, animations, rencontres et découverte.",
    program: [
      { time: "14:00", label: "Ouverture des portes & accueil" },
      { time: "15:00", label: "Tournois communautaires" },
      { time: "18:00", label: "Show-match Eden" },
      { time: "20:00", label: "Cérémonie & annonces" },
    ],
    // ticketUrl: "https://…"  ← décommente quand la billetterie est prête
    // hotels / restaurants : ajoute des liens si tu veux une sélection ; sinon des liens de recherche s'affichent automatiquement.
  },
  {
    slug: "eden-atelier-decouverte",
    title: "Atelier découverte de l'esport",
    category: "Atelier",
    date: "5 septembre 2026",
    iso: "2026-09-05T14:00",
    place: "Metz",
    address: "Metz, France",
    status: "upcoming",
    tag: "Jeunesse",
    description:
      "Un atelier de découverte auprès des jeunes : comprendre l'esport, ses métiers et ses codes, dans un cadre encadré et bienveillant.",
    program: [
      { time: "14:00", label: "Accueil & présentation" },
      { time: "14:30", label: "Découverte des jeux & rôles" },
      { time: "16:00", label: "Mini-tournoi encadré" },
    ],
  },
  {
    slug: "eden-cup-test",
    title: "Eden Cup — Édition test",
    category: "Tournoi",
    date: "8 mars 2026",
    iso: "2026-03-08T10:00",
    place: "En ligne",
    status: "past",
    tag: "Passé",
    description:
      "Édition de démonstration illustrant la fiche événement. Les tournois réels seront ajoutés ici.",
    program: [{ time: "10:00", label: "Phase de poules" }, { time: "16:00", label: "Finale" }],
  },
];
