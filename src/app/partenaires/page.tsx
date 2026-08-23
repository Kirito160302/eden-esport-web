import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/ui";
import { PARTNERS } from "@/lib/partners-data";
import PartnerLogo from "@/components/PartnerLogo";

export const metadata: Metadata = { title: "Partenaires" };

const tierLabel: Record<string, string> = {
  principal: "Partenaire principal",
  officiel: "Partenaire officiel",
  technique: "Partenaire technique",
};

export default function PartenairesPage() {
  // le bandeau défile en boucle : on double la liste pour un défilement sans couture
  const marquee = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Partenaires" }]}
        eyebrow="Ils construisent Eden" eyebrowGold title="Nos partenaires"
        lead="Eden avance entouré de partenaires qui partagent sa vision. Découvrez celles et ceux qui écrivent cette histoire avec nous."
      />

      {/* BANDEAU DÉFILANT */}
      <div className="pt-marquee" aria-label="Nos partenaires">
        <div className="pt-marquee-track">
          {marquee.map((p, i) => (
            <span className="pt-marquee-item" key={i} aria-hidden={i >= PARTNERS.length}>
              <PartnerLogo name={p.name} logo={p.logo} />
            </span>
          ))}
        </div>
      </div>

      {/* BLOCS PARTENAIRES */}
      <section className="section"><div className="wrap">
        <div className="pt-list">
          {PARTNERS.map((p, i) => (
            <article className={"pt-block" + (i % 2 ? " pt-block--rev" : "")} key={p.name}>
              <div className="pt-block-logo">
                <PartnerLogo name={p.name} logo={p.logo} imgClass="pt-block-logo-img" />
              </div>
              <div className="pt-block-body">
                {p.tier && <span className="pt-tier">{tierLabel[p.tier]}</span>}
                <h2>{p.name}</h2>
                <p>{p.description}</p>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn--gold">
                    Découvrir<span className="arw">→</span>
                  </a>
                ) : (
                  <span className="btn btn--ghost btn--sm" style={{ opacity: 0.6, cursor: "default" }}>Site à venir</span>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* POURQUOI NOUS REJOINDRE */}
        <div style={{ marginTop: "4rem" }}>
          <SectionHead eyebrow="Pourquoi nous rejoindre" title="Devenir partenaire d'Eden" />
          <div className="grid-3">
            <div className="panel"><h3>Visibilité</h3><p>Une marque premium et une communauté engagée, en ligne et lors de nos événements.</p></div>
            <div className="panel"><h3>Impact local</h3><p>Des actions concrètes auprès des jeunes et des territoires, porteuses de sens.</p></div>
            <div className="panel"><h3>Partenariat sur mesure</h3><p>Naming, technique, institutionnel : un dispositif adapté à vos objectifs.</p></div>
          </div>
          <div style={{ textAlign: "center", marginTop: "2.4rem" }}>
            <Link href="/contact" className="btn btn--gold">Devenir partenaire<span className="arw">→</span></Link>
          </div>
        </div>
      </div></section>
    </>
  );
}
