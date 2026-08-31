import Link from "next/link";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Eden", links: [["À propos", "/eden"], ["Notre histoire", "/eden"], ["Notre équipe", "/notre-equipe"], ["Rejoindre Eden", "/rejoindre"]] },
  { title: "Esport", links: [["Nos équipes", "/equipes"], ["Joueurs", "/joueurs"], ["Résultats", "/esport"], ["Recrutement", "/rejoindre"]] },
  { title: "Écosystème", links: [["Événements", "/evenements"], ["Nos services", "/actions"], ["Ateliers & médiation", "/services/ateliers"], ["Organisation", "/services/organisation"]] },
  { title: "Ressources", links: [["Actualités", "/actualites"], ["Blog", "/blog"], ["Boutique", "/boutique"], ["Partenaires", "/partenaires"], ["Presse", "/presse"], ["FAQ", "/faq"], ["Contact", "/contact"]] },
];

export default function Footer() {
  return (
    <footer className="footer" aria-label="Pied de page">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <img src="/symbol.png" alt="" width={38} aria-hidden="true" />
              <span className="wm">EDEN<small>E-SPORT</small></span>
            </Link>
            <p>Structure esport française. Nous ne construisons pas seulement des équipes — nous bâtissons un héritage.</p>
            <div className="socials" aria-label="Réseaux sociaux">
              <a href="https://x.com/EdenEsport01" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7 8 8.3 12h-6.5l-5-6.6L5 22H2l7.5-8.6L1.5 2H8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 4H5.5l12.3 16Z" /></svg></a>
              <a href="https://www.instagram.com/eden_esport/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></a>
              <a href="https://www.twitch.tv/edenesport" target="_blank" rel="noopener noreferrer" aria-label="Twitch"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3 3 7v12h4v2h3l2-2h3l5-5V3H4Zm16 8-3 3h-4l-2 2v-2H7V5h13v6Z" /><path d="M15 7h2v4h-2zM10 7h2v4h-2z" /></svg></a>
              <a href="https://www.youtube.com/@Eden-Esport" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.4-5a2.6 2.6 0 0 0-1.8-1.9C19 4.8 12 4.8 12 4.8s-7 0-8.8.3A2.6 2.6 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a2.6 2.6 0 0 0 1.8 1.9c1.8.3 8.8.3 8.8.3s7 0 8.8-.3a2.6 2.6 0 0 0 1.8-1.9c.4-1.6.4-5 .4-5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" /></svg></a>
              <a href="https://discord.gg/tkcpAUqHQg" target="_blank" rel="noopener noreferrer" aria-label="Discord"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.3.5c1.7.4 2.8 1 3.9 1.7A13 13 0 0 0 12 4.3c-2.3 0-4.5.4-7 1.4C6 5 7.1 4.4 8.8 4l-.2-.5A19.8 19.8 0 0 0 3.7 4.4C1.2 8.1.5 11.7.8 15.3a20 20 0 0 0 6 3l.8-1.3c-.7-.2-1.4-.6-2-1l.5-.4c3.8 1.8 8 1.8 11.8 0l.5.4c-.6.4-1.3.8-2 1l.8 1.3a20 20 0 0 0 6-3c.4-4.2-.6-7.8-2.7-10.9ZM8.9 13.5c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm6.2 0c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.7 1.9-1.7 1.9Z" /></svg></a>
            </div>
          </div>
          {COLS.map((c) => (
            <div className="fcol" key={c.title}>
              <h4>{c.title}</h4>
              {c.links.map(([l, h]) => <Link key={l + h} href={h}>{l}</Link>)}
            </div>
          ))}
        </div>

        <div className="newsletter">
          <div><h4>Reste dans l'Eden</h4><p>Actualités, drops boutique et annonces événements — directement dans ta boîte mail.</p></div>
          <form className="nl-form" aria-label="Inscription newsletter">
            <input type="email" placeholder="Ton adresse e-mail" aria-label="Adresse e-mail" required />
            <button className="btn btn--sm" type="button">S&apos;inscrire</button>
          </form>
        </div>

        <div className="footer-bottom">
          <p className="sig"><span className="grad-text">We do not only build teams.</span> <span className="l2">We build a legacy.</span></p>
          <div className="legal">
            <Link href="/legal/mentions">Mentions légales</Link>
            <Link href="/legal/confidentialite">Confidentialité</Link>
            <Link href="/legal/cookies">Cookies</Link>
            <Link href="/legal/cgv">CGV</Link>
            <Link href="/espace">Espace équipe</Link>
          </div>
        </div>
        <p className="copy" style={{ paddingBottom: "2.5rem" }}>© 2026 Eden Esport — Tous droits réservés.</p>
      </div>
    </footer>
  );
}
