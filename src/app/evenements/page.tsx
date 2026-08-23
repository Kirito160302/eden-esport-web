import type { Metadata } from "next";
import { getEvents } from "@/lib/content";
import { PageHero } from "@/components/ui";
import EventsExplorer from "@/components/EventsExplorer";

export const metadata: Metadata = { title: "Événements" };

export default async function EvenementsPage() {
  const events = await getEvents();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Événements" }]}
        eyebrow="Le hub" title="Événements"
        lead="Tournois, LAN, ateliers et rassemblements. Retrouve le prochain rendez-vous, la chronologie complète et toutes les infos pratiques."
      />
      <section className="section"><div className="wrap">
        <EventsExplorer events={events} />
      </div></section>
    </>
  );
}
