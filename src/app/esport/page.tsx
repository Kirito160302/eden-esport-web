import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import EsportTabs from "@/components/EsportTabs";
import { getEsportGames } from "@/lib/content";

export const metadata: Metadata = { title: "Esport" };

export default async function EsportPage() {
  const games = await getEsportGames();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Esport" }]}
        eyebrow="La compétition" title="L'esport Eden"
        lead="Une vision compétitive fondée sur la discipline, la progression et l'esprit collectif. Choisis un jeu pour découvrir l'équipe, son palmarès, son calendrier et ses replays."
      />
      <section className="section"><div className="wrap">
        <EsportTabs games={games} />
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="panel" style={{ textAlign: "center", padding: "clamp(2.2rem,5vw,3.4rem)" }}>
          <p className="eyebrow eyebrow--center">Recrutement</p>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Tu veux jouer sous les couleurs d&apos;Eden ?</h2>
          <Link href="/rejoindre" className="btn">Voir les opportunités<span className="arw">→</span></Link>
        </div>
      </div></section>
    </>
  );
}
