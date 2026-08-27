import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Galerie" };

// { src, cat, label }
const PHOTOS: { src: string; cat: string; label: string }[] = [
  { src: "/gallery/g02.jpg", cat: "Équipes", label: "Les équipes sur scène" },
  { src: "/gallery/g04.jpg", cat: "Équipes", label: "L'équipe Eden" },
  { src: "/gallery/g11.jpg", cat: "Événements", label: "Sur scène" },
  { src: "/gallery/g06.jpg", cat: "Événements", label: "Tournoi" },
  { src: "/gallery/g01.jpg", cat: "Événements", label: "League of Legends" },
  { src: "/gallery/g08.jpg", cat: "Événements", label: "Fortnite" },
  { src: "/gallery/g03.jpg", cat: "Communauté", label: "Photo de groupe" },
  { src: "/gallery/g10.jpg", cat: "Communauté", label: "Transmission" },
  { src: "/gallery/g07.jpg", cat: "Communauté", label: "Espace jeu libre" },
  { src: "/gallery/g09.jpg", cat: "Communauté", label: "Jeune joueur" },
  { src: "/gallery/g05.jpg", cat: "Coulisses", label: "En régie" },
];

export default function GaleriePage() {
  const items = PHOTOS.map((p, i) => ({
    cat: p.cat,
    node: (
      <div className="gal-item gal-item--photo" key={i}>
        <img src={p.src} alt={`${p.cat} — ${p.label}`} loading="lazy" />
        <span className="cap">{p.label}</span>
      </div>
    ),
  }));

  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Galerie" }]}
        eyebrow="En images" title="Galerie"
        lead="Retour en images sur nos temps forts : compétitions, scène, transmission et communauté — ici, la Video Games Week #9."
      />
      <section className="section"><div className="wrap">
        <Filterable
          options={[
            { label: "Tout", value: "all" },
            { label: "Événements", value: "Événements" },
            { label: "Équipes", value: "Équipes" },
            { label: "Communauté", value: "Communauté" },
            { label: "Coulisses", value: "Coulisses" },
          ]}
          items={items} gridClass="gallery-grid"
        />
        <p className="tmp" style={{ marginTop: "1.4rem" }}>Photos : Video Games Week #9 — © Karine Gomez.</p>
      </div></section>
    </>
  );
}
