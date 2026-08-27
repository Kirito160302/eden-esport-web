import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Presse" };

const FACTS: [string, string][] = [
  ["Structure", "Association loi 1901"],
  ["Siège", "Coutras (Gironde)"],
  ["Disciplines", "League of Legends · Valorant"],
  ["Activités", "Compétition · Événementiel · Actions jeunesse"],
];

export default function PressePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Presse" }]}
        eyebrow="Médias" title="Espace presse"
        lead="Informations, ressources et contact pour les journalistes et créateurs de contenu qui souhaitent parler d'Eden Esport."
      />

      {/* EDEN EN BREF */}
      <section className="section"><div className="wrap">
        <p className="eyebrow">Eden en bref</p>
        <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.4rem" }}>La structure en un coup d'œil</h2>
        <div className="grid-4">
          {FACTS.map(([k, v]) => (
            <div className="panel" key={k}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: ".72rem", fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: ".4rem" }}>{k}</div>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ maxWidth: "70ch", marginTop: "1.6rem" }}>
          Eden Esport est une association esport française basée à Coutras. Nous ne construisons pas seulement des équipes :
          nous bâtissons une communauté, transmettons une culture et menons des actions auprès des jeunes autour du jeu vidéo.
          Notre signature : <em>« We do not only build teams. We build a legacy. »</em>
        </p>
      </div></section>

      {/* KIT MÉDIA */}
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap grid-2" style={{ alignItems: "start" }}>
        <div>
          <p className="eyebrow">Kit média</p>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Ressources</h2>
          <a href="/eden-logo.png" download className="info-block" style={{ textDecoration: "none" }}>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" /></svg></span>
            <div><h4>Logo Eden Esport</h4><p>Télécharger le logo officiel (PNG haute définition) →</p></div>
          </a>
          <a href="/og-image.png" download className="info-block" style={{ marginTop: ".8rem", textDecoration: "none" }}>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><rect x="3" y="4" width="18" height="14" rx="1" /><path d="M3 8h18" /></svg></span>
            <div><h4>Visuel de marque</h4><p>Bannière officielle (1200×630) →</p></div>
          </a>
          <div className="info-block" style={{ marginTop: ".8rem" }}>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M4 4h16v12H7l-3 3z" /></svg></span>
            <div><h4>Interview & reportage</h4><p>Une demande particulière (photos, joueurs, déplacement) ? <Link href="/contact">Écris-nous →</Link></p></div>
          </div>
        </div>

        <div>
          <p className="eyebrow">Contact presse</p>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.2rem" }}>Nous joindre</h2>
          <div className="panel">
            <p style={{ margin: ".2rem 0 .8rem" }}><strong style={{ color: "var(--text)" }}>Email :</strong> <a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a></p>
            <p style={{ margin: ".2rem 0 1rem" }}><strong style={{ color: "var(--text)" }}>Réseaux :</strong>{" "}
              <a href="https://x.com/EdenEsport01" target="_blank" rel="noopener noreferrer">X</a> ·{" "}
              <a href="https://www.instagram.com/eden_esport/" target="_blank" rel="noopener noreferrer">Instagram</a> ·{" "}
              <a href="https://www.twitch.tv/edenesport" target="_blank" rel="noopener noreferrer">Twitch</a> ·{" "}
              <a href="https://www.youtube.com/@Eden-Esport" target="_blank" rel="noopener noreferrer">YouTube</a>
            </p>
            <Link href="/contact" className="btn btn--sm">Contacter Eden<span className="arw">→</span></Link>
          </div>
          <p className="tmp" style={{ marginTop: "1rem" }}>Nous répondons généralement sous quelques jours.</p>
        </div>
      </div></section>
    </>
  );
}
