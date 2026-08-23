import type { Metadata } from "next";
import Link from "next/link";
import { getTeams } from "@/lib/content";
import { PageHero, SectionHead } from "@/components/ui";
import { TeamCard, SoonCard } from "@/components/cards";

export const metadata: Metadata = { title: "Esport" };

export default async function EsportPage() {
  const teams = await getTeams();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Esport" }]}
        eyebrow="La compétition" title="L'esport Eden"
        lead="Une vision compétitive fondée sur la discipline, la progression et l'esprit collectif. Nos équipes portent les couleurs d'Eden avec exigence et humilité."
      />
      <section className="section"><div className="wrap">
        <SectionHead eyebrow="Nos équipes" title="Les sections Eden" />
        <div className="grid-3">{teams.map((t) => <TeamCard key={t.slug} team={t} />)}<SoonCard /></div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap grid-2">
        <div>
          <p className="eyebrow">Agenda</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Prochains matchs</h2>
          <div className="match"><span className="comp">Match amical</span><span className="teams">Eden — À définir</span><span className="date">À programmer</span></div>
          <div className="match"><span className="comp">Ligue</span><span className="teams">Eden — À définir</span><span className="date">À programmer</span></div>
          <p className="tmp" style={{ marginTop: ".8rem" }}>* Calendrier provisoire — alimenté via le CMS.</p>
        </div>
        <div>
          <p className="eyebrow">Historique</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Derniers résultats</h2>
          <div className="panel"><h3>Palmarès à écrire</h3><p>Eden débute sa saison compétitive. Les résultats officiels apparaîtront ici — aucun résultat inventé.</p></div>
        </div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap"><div className="panel" style={{ textAlign: "center", padding: "clamp(2.2rem,5vw,3.4rem)" }}>
        <p className="eyebrow eyebrow--center">Recrutement</p>
        <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Tu veux jouer sous les couleurs d&apos;Eden ?</h2>
        <Link href="/rejoindre" className="btn">Voir les opportunités<span className="arw">→</span></Link>
      </div></div></section>
    </>
  );
}
