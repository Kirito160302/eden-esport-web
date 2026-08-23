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
              <a href="#" aria-label="X / Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7 8 8.3 12h-6.5l-5-6.6L5 22H2l7.5-8.6L1.5 2H8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 4H5.5l12.3 16Z" /></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></a>
              <a href="#" aria-label="Twitch"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3 3 7v12h4v2h3l2-2h3l5-5V3H4Zm16 8-3 3h-4l-2 2v-2H7V5h13v6Z" /><path d="M15 7h2v4h-2zM10 7h2v4h-2z" /></svg></a>
              <a href="#" aria-label="Discord"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 5.5A16 16 0 0 0 15.6 4l-.3.5A13 13 0 0 1 18 5.6a13.5 13.5 0 0 0-12 0 13 13 0 0 1 2.7-1.1L8.4 4A16 16 0 0 0 4.5 5.5C2.3 9 1.7 12.4 2 15.8A16 16 0 0 0 6.9 18l.6-.9a10 10 0 0 1-1.6-.8l.4-.3a11.5 11.5 0 0 0 9.4 0l.4.3a10 10 0 0 1-1.6.8l.6.9A16 16 0 0 0 22 15.8c.4-3.9-.6-7.3-2.5-10.3ZM9 14c-.8 0-1.4-.7-1.4-1.6S8.2 10.8 9 10.8s1.4.7 1.4 1.6S9.8 14 9 14Zm6 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6S15.8 14 15 14Z" /></svg></a>
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
          </div>
        </div>
        <p className="copy" style={{ paddingBottom: "2.5rem" }}>© 2026 Eden Esport — Tous droits réservés.</p>
      </div>
    </footer>
  );
}
