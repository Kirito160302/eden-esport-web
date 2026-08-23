import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Notre équipe" };

const STAFF: [string, string][] = [
  ["Kirito", "Fondateur & Président"],
  ["Poste ouvert", "Responsable esport"],
  ["Poste ouvert", "Responsable événementiel"],
  ["Poste ouvert", "Communication"],
];

export default function NotreEquipePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Eden", href: "/eden" }, { label: "Notre équipe" }]}
        eyebrow="Les visages d'Eden" title="L'équipe"
        lead="Direction, esport, événementiel, communication et bénévoles : celles et ceux qui font vivre Eden au quotidien."
      />
      <section className="section"><div className="wrap">
        <p className="eyebrow">Direction</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.6rem" }}>Fondation</h2>
        <div className="grid-4">
          {STAFF.map(([name, role], i) => (
            <div className="player-card" key={i}>
              <div className="player-avatar"><span className="ini">{name === "Poste ouvert" ? "?" : name[0]}</span></div>
              <div className="pc-body"><div className="pseudo">{name}</div><div className="name">{role}</div></div>
            </div>
          ))}
        </div>
        <p className="tmp" style={{ marginTop: "1.4rem" }}>* Organigramme provisoire — l&apos;équipe se constitue. Envie d&apos;en faire partie ? <Link href="/rejoindre" style={{ color: "var(--lavender)" }}>Rejoins-nous</Link>.</p>
      </div></section>
    </>
  );
}
