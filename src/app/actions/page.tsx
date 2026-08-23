import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/ui";

export const metadata: Metadata = { title: "Nos actions" };

const AXES: [string, string][] = [
  ["Compétition", "Des équipes exigeantes qui portent les couleurs d'Eden sur les scènes esport."],
  ["Événements", "Tournois, LAN et rassemblements gaming clés en main."],
  ["Jeunesse & transmission", "Ateliers de découverte et sensibilisation auprès des jeunes."],
  ["Médiation esport", "Une passerelle entre l'esport, les familles et les institutions."],
  ["Communauté", "Une communauté vivante fédérée par nos valeurs."],
  ["Accompagnement", "Consulting et stratégie pour vos projets gaming et esport."],
];

const SERVICES: [string, string, string][] = [
  ["Organisation d'événements", "Tournois, LAN et animations pour collectivités, entreprises et associations.", "/services/organisation"],
  ["Ateliers & médiation", "Actions éducatives auprès des jeunes : découverte, contenu, citoyenneté numérique.", "/services/ateliers"],
  ["Consulting & accompagnement", "Stratégie et production pour développer un projet gaming, esport ou événementiel.", "/services/consulting"],
];

export default function ActionsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Nos actions" }]}
        eyebrow="Notre écosystème" title="Nos actions & services"
        lead="Bien plus qu'une équipe compétitive : Eden organise, transmet et accompagne. Découvre ce que nous pouvons construire ensemble."
      />
      <section className="section"><div className="wrap">
        <div className="grid-3">
          {AXES.map((a, i) => (
            <div className="panel" key={a[0]}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, color: "var(--muted-2)", marginBottom: ".6rem" }}>0{i + 1}</div>
              <h3>{a[0]}</h3><p>{a[1]}</p>
            </div>
          ))}
        </div>
      </div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <SectionHead eyebrow="Nos services" title="Trois expertises à votre service" />
        <div className="grid-3">
          {SERVICES.map(([t, d, href]) => (
            <Link className="panel" href={href} key={t} style={{ display: "block" }}>
              <h3>{t}</h3><p>{d}</p><span className="tag" style={{ marginTop: "1rem" }}>Découvrir →</span>
            </Link>
          ))}
        </div>
      </div></section>
    </>
  );
}
