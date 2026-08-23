import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { FAQ } from "@/lib/content";
import Accordion from "@/components/Accordion";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Accueil", href: "/" }, { label: "FAQ" }]} eyebrow="Vous vous demandez…" title="Questions fréquentes" />
      <section className="section"><div className="wrap" style={{ maxWidth: 820 }}>
        <Accordion items={FAQ} />
      </div></section>
    </>
  );
}
