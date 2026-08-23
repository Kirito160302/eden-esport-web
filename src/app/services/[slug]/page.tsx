import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";

type Svc = { title: string; lead: string; blocks: [string, string][]; cta: string };

const SERVICES: Record<string, Svc> = {
  organisation: {
    title: "Organisation d'événements gaming & esport",
    lead: "Pour les collectivités, entreprises, associations, établissements et événements privés : Eden conçoit et opère des expériences gaming clés en main.",
    blocks: [
      ["Formats sur mesure", "Tournois, LAN, animations, arènes gaming, initiations et scènes esport adaptés à votre public."],
      ["Production & technique", "Matériel, régie, streaming, casting et scénographie aux couleurs de votre projet."],
      ["Animation & encadrement", "Une équipe expérimentée pour rythmer l'événement et garantir une expérience fluide et sécurisée."],
    ],
    cta: "Demander un devis",
  },
  ateliers: {
    title: "Ateliers jeunesse & médiation esport",
    lead: "Pour les jeunes, associations, collectivités, établissements scolaires et structures jeunesse : des ateliers qui font de l'esport un outil de transmission et de citoyenneté.",
    blocks: [
      ["Découverte de l'esport", "Comprendre l'esport, ses métiers et ses codes."],
      ["Création de contenu & Twitch", "Streaming, montage et prise de parole responsable."],
      ["Citoyenneté numérique", "Usages, sécurité et bienveillance en ligne."],
    ],
    cta: "Nous contacter",
  },
  consulting: {
    title: "Vous avez une idée. Nous la transformons en projet.",
    lead: "Accompagnement des structures qui veulent développer un projet gaming, esport, un événement, une communauté ou une stratégie digitale.",
    blocks: [
      ["Stratégie", "Positionnement, modèle, feuille de route et objectifs mesurables."],
      ["Événementiel & esport", "Conception d'événements et structuration d'équipes."],
      ["Communauté & production", "Animation, contenus, streaming et présence digitale."],
    ],
    cta: "Parlons de votre projet",
  },
};

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES[slug];
  return { title: s ? s.title : "Service" };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) notFound();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Nos actions", href: "/actions" }, { label: s.title }]}
        eyebrow="Service" eyebrowGold title={s.title} lead={s.lead}
      />
      <section className="section"><div className="wrap">
        <div className="grid-3">
          {s.blocks.map(([t, d]) => <div className="panel" key={t}><h3>{t}</h3><p>{d}</p></div>)}
        </div>
        <div className="panel" style={{ textAlign: "center", marginTop: "3rem", padding: "clamp(2rem,5vw,3rem)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Un projet en tête ?</h2>
          <Link href="/contact" className="btn btn--gold">{s.cta}<span className="arw">→</span></Link>
        </div>
      </div></section>
    </>
  );
}
