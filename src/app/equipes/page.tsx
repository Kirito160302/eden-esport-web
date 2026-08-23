import type { Metadata } from "next";
import { getTeams, filterOptions } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { TeamCard, SoonCard } from "@/components/cards";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Nos équipes" };

export default async function EquipesPage() {
  const teams = await getTeams();
  const options = filterOptions(teams.map((t) => [t.gameKey, t.game || t.gameKey]), "Toutes");
  const items = [
    ...teams.map((t) => ({ cat: t.gameKey, node: <TeamCard key={t.slug} team={t} /> })),
    { cat: "soon", node: <SoonCard key="soon" /> },
  ];
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Esport", href: "/esport" }, { label: "Équipes" }]}
        eyebrow="Roster" title="Nos équipes"
        lead="Chaque équipe Eden partage les mêmes valeurs : exigence, progression et unité."
      />
      <section className="section"><div className="wrap">
        <Filterable options={options} items={items} gridClass="teams-grid" />
      </div></section>
    </>
  );
}
