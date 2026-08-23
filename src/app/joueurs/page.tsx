import type { Metadata } from "next";
import { getPlayers, filterOptions } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { PlayerCard } from "@/components/cards";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Joueurs" };

export default async function JoueursPage() {
  const players = await getPlayers();
  const options = filterOptions(players.map((p) => [p.gameKey, p.game || p.gameKey]), "Tous");
  const items = players.map((p) => ({ cat: p.gameKey, node: <PlayerCard key={p.slug} player={p} /> }));
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Joueurs" }]}
        eyebrow="Annuaire" title="Les joueurs Eden"
        lead="Découvre les profils de nos compétiteurs."
      />
      <section className="section"><div className="wrap">
        <Filterable options={options} items={items} gridClass="grid-4" />
      </div></section>
    </>
  );
}
