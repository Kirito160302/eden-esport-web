import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import Espace from "@/components/Espace";

export const metadata: Metadata = {
  title: "Espace équipe",
  robots: { index: false, follow: false }, // espace privé : pas d'indexation
};

export default function EspacePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Espace équipe" }]}
        eyebrow="Interne" title="Espace équipe"
        lead="Plannings, matchs et disponibilités — réservé aux joueurs et au staff d'Eden."
      />
      <section className="section"><div className="wrap esp-wrap">
        <Espace />
      </div></section>
    </>
  );
}
