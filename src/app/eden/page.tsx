import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/ui";
import { VALUES } from "@/lib/content";

export const metadata: Metadata = { title: "Eden — À propos" };

const TIMELINE: [string, string, string][] = [
  ["2024", "Naissance d'Eden", "Création de la structure et pose des fondations : identité, valeurs et vision. Le symbole Eden voit le jour."],
  ["2025", "Structuration", "Mise en place de l'organisation, de la charte de marque et des premiers partenariats."],
  ["2026", "Premières sections & actions", "Lancement des sections Valorant et League of Legends, et des premières actions événementielles et jeunesse."],
  ["Demain", "L'héritage", "Grandir, transmettre, rassembler. Faire d'Eden une référence de l'esport engagé et durable."],
];

export default function EdenPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Eden" }]}
        eyebrow="Qui sommes-nous"
        title={<>Nous construisons<br />un <span className="grad-text">héritage</span>.</>}
        lead="Eden Esport est une structure française ambitieuse qui construit plus que des équipes. Unis par la passion, guidés par la discipline, nous visons l'excellence sur et en dehors du jeu."
      />
      <section className="section"><div className="wrap grid-2" style={{ alignItems: "center" }}>
        <div>
          <p className="eyebrow">L&apos;histoire</p>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.1rem" }}>Une aventure qui commence</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>Née de la conviction que l&apos;esport peut fédérer, transmettre et faire grandir, Eden réunit des passionnés autour d&apos;un même cap : bâtir une structure sérieuse, humaine et tournée vers l&apos;avenir.</p>
          <p className="muted">Nous voulons offrir un cadre d&apos;excellence à nos joueurs, un terrain de jeu à notre communauté, et des actions concrètes auprès des jeunes et des territoires.</p>
        </div>
        <div className="essence-visual" aria-hidden="true"><span className="ring"></span><span className="ring r2"></span><img src="/symbol.png" alt="" /></div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <p className="eyebrow">Notre parcours</p>
        <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: ".5rem" }}>La trajectoire d&apos;Eden</h2>
        <div className="timeline">
          {TIMELINE.map(([yr, h, p]) => (
            <div className="tl-item" key={yr}><div className="yr">{yr}</div><h4>{h}</h4><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap grid-2">
        <div className="panel"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 0 1 10 10M12 22A10 10 0 0 1 2 12" /></svg></span><h3>Notre vision</h3><p>Un esport qui rassemble et élève : des équipes qui inspirent, une communauté qui vit, et un impact positif sur son territoire.</p></div>
        <div className="panel"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M12 2 15 9l7 .5-5.4 4.5L18 21l-6-3.8L6 21l1.4-7L2 9.5 9 9z" /></svg></span><h3>Notre mission</h3><p>Bâtir des équipes exigeantes, organiser des expériences mémorables et accompagner celles et ceux qui veulent grandir grâce au gaming.</p></div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <SectionHead eyebrow="Ce qui nous guide" title="Nos cinq valeurs" />
        <div className="grid-3">
          {VALUES.map(([name, desc]) => (
            <div className="value-card" key={name}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M12 3 15 9l7 .5-5.4 4.5L18 21l-6-3.8L6 21l1.4-7L2 9.5 9 9z" /></svg></span>
              <h3>{name}</h3><p>{desc}</p>
            </div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="panel" style={{ textAlign: "center", padding: "clamp(2.5rem,6vw,4rem)" }}>
          <p className="eyebrow eyebrow--center eyebrow--gold">Notre ambition</p>
          <h2 style={{ fontSize: "var(--fs-h2)", maxWidth: "22ch", margin: "0 auto 1rem" }}>Encore en construction — mais nous savons où nous allons.</h2>
          <Link href="/rejoindre" className="btn">Rejoindre Eden<span className="arw">→</span></Link>
        </div>
      </div></section>
    </>
  );
}
