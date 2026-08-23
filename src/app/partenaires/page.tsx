import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/ui";

export const metadata: Metadata = { title: "Partenaires" };

export default function PartenairesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Partenaires" }]}
        eyebrow="Ils construisent Eden" eyebrowGold title="Nos partenaires"
        lead="Eden avance entouré de partenaires qui partagent sa vision. Ces emplacements attendent les structures qui écriront cette histoire avec nous."
      />
      <section className="section"><div className="wrap">
        <div className="partner-cat"><span className="k">Partenaire principal</span><div className="partner-row p-principal"><div className="p-slot">Emplacement réservé</div><div className="p-slot">Emplacement réservé</div></div></div>
        <div className="partner-cat"><span className="k">Partenaires officiels</span><div className="partner-row p-officiels"><div className="p-slot">Officiel</div><div className="p-slot">Officiel</div><div className="p-slot">Officiel</div><div className="p-slot">Officiel</div></div></div>
        <div className="partner-cat"><span className="k">Partenaires techniques & institutionnels</span><div className="partner-row p-techniques"><div className="p-slot">Technique</div><div className="p-slot">Technique</div><div className="p-slot">Institutionnel</div><div className="p-slot">Institutionnel</div></div></div>
        <div style={{ marginTop: "3rem" }}>
          <SectionHead eyebrow="Pourquoi nous rejoindre" title="Devenir partenaire d'Eden" />
          <div className="grid-3">
            <div className="panel"><h3>Visibilité</h3><p>Une marque premium et une communauté engagée, en ligne et lors de nos événements.</p></div>
            <div className="panel"><h3>Impact local</h3><p>Des actions concrètes auprès des jeunes et des territoires, porteuses de sens.</p></div>
            <div className="panel"><h3>Partenariat sur mesure</h3><p>Naming, technique, institutionnel : un dispositif adapté à vos objectifs.</p></div>
          </div>
          <div style={{ textAlign: "center", marginTop: "2.4rem" }}><Link href="/contact" className="btn btn--gold">Devenir partenaire<span className="arw">→</span></Link></div>
        </div>
      </div></section>
    </>
  );
}
