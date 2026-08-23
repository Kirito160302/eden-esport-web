import type { Metadata } from "next";
import { getArticles, getEvents } from "@/lib/content";
import { ESPORT } from "@/lib/esport-data";
import { PageHero } from "@/components/ui";
import JournalPortal from "@/components/JournalPortal";

export const metadata: Metadata = { title: "Actualités" };

export default async function ActualitesPage() {
  const [articles, events] = await Promise.all([getArticles(), getEvents()]);

  const matches = ESPORT.flatMap((g) => g.calendar.map((m) => ({ ...m, game: g.label, gameKey: g.key })));
  const tournaments = events
    .filter((e) => e.category === "Tournoi")
    .map((e) => ({ slug: e.slug, title: e.title, date: e.date, place: e.place }));

  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Actualités" }]}
        eyebrow="Le média Eden" title="Actualités & esport"
        lead="L'actu d'Eden et de l'esport — choisis une chaîne pour suivre les matchs, les tournois et les dernières news."
      />
      <section className="section"><div className="wrap">
        <JournalPortal articles={articles} matches={matches} tournaments={tournaments} />
      </div></section>
    </>
  );
}
