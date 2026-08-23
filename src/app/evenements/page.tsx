import type { Metadata } from "next";
import { getEvents } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { EventCard } from "@/components/cards";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Événements" };

export default async function EvenementsPage() {
  const events = await getEvents();
  const items = events.map((e) => ({ cat: e.status, node: <EventCard key={e.slug} event={e} /> }));
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Événements" }]}
        eyebrow="Le hub" title="Événements"
        lead="Tournois, LAN, rassemblements et actions Eden. Retrouve ici tout ce que nous organisons ou portons."
      />
      <section className="section"><div className="wrap">
        <Filterable
          options={[{ label: "Tous", value: "all" }, { label: "À venir", value: "upcoming" }, { label: "Passés", value: "past" }]}
          items={items} gridClass="grid-2"
        />
        <p className="tmp" style={{ marginTop: "1.4rem" }}>* Événements provisoires — informations à confirmer.</p>
      </div></section>
    </>
  );
}
