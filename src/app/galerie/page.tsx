import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { GALLERY } from "@/lib/content";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Galerie" };

export default function GaleriePage() {
  const items = GALLERY.map(([cat, label], i) => ({
    cat,
    node: (
      <div className="gal-item" key={i}>
        <img src="/symbol.png" alt="" />
        <span className="cap">{cat} — {label}</span>
      </div>
    ),
  }));
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Galerie" }]}
        eyebrow="En images" title="Galerie"
        lead={<>Événements, compétitions, équipes, communauté et coulisses. <span className="tmp">Visuels de démonstration.</span></>}
      />
      <section className="section"><div className="wrap">
        <Filterable
          options={[{ label: "Tout", value: "all" }, { label: "Événements", value: "Événements" }, { label: "Équipes", value: "Équipes" }, { label: "Communauté", value: "Communauté" }, { label: "Backstage", value: "Backstage" }]}
          items={items} gridClass="gallery-grid"
        />
      </div></section>
    </>
  );
}
