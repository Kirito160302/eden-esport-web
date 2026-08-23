import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Presse" };

export default function PressePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Presse" }]}
        eyebrow="Médias" title="Espace presse"
        lead="Ressources, informations et contact pour les journalistes et créateurs de contenu."
      />
      <section className="section"><div className="wrap grid-2" style={{ alignItems: "start" }}>
        <div>
          <p className="eyebrow">Communiqués</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Derniers communiqués</h2>
          <div className="match"><span className="teams">Eden Esport dévoile son identité de marque</span><span className="date">Août 2026</span></div>
          <div className="match"><span className="teams">Lancement des sections Valorant & LoL</span><span className="date">2026</span></div>
          <p className="tmp" style={{ marginTop: ".8rem" }}>* Communiqués d&apos;exemple.</p>
        </div>
        <div>
          <p className="eyebrow">Kit média</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Ressources</h2>
          <div className="info-block"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" /></svg></span><div><h4>Logos & symbole</h4><p>Pack logos (SVG/PNG) — disponible sur demande.</p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><rect x="3" y="4" width="18" height="14" rx="1" /><path d="M3 8h18" /></svg></span><div><h4>Photos & visuels</h4><p>Banque d&apos;images de la structure — sur demande.</p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M4 4h16v12H7l-3 3z" /></svg></span><div><h4>Contact presse</h4><Link href="/contact">Écrire à Eden →</Link></div></div>
        </div>
      </div></section>
    </>
  );
}
