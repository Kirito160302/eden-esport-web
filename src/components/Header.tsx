"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartBadge } from "./shop";

type Child = { label: string; href: string; desc?: string };
type Item = { label: string; href: string; children?: Child[] };

const NAV: Item[] = [
  {
    label: "Eden", href: "/eden", children: [
      { label: "À propos d'Eden", href: "/eden", desc: "Notre histoire & notre vision" },
      { label: "Notre équipe", href: "/notre-equipe", desc: "Les visages de la structure" },
    ],
  },
  {
    label: "Esport", href: "/esport", children: [
      { label: "Nos équipes", href: "/esport", desc: "Rosters, palmarès & calendrier" },
      { label: "Nos joueurs", href: "/joueurs", desc: "Les profils compétitifs" },
      { label: "Recrutement", href: "/rejoindre", desc: "Rejoindre une équipe Eden" },
    ],
  },
  { label: "Événements", href: "/evenements" },
  {
    label: "Nos services", href: "/actions", children: [
      { label: "Vue d'ensemble", href: "/actions", desc: "Tout ce qu'Eden propose" },
      { label: "Organisation d'événements", href: "/services/organisation", desc: "Tournois, LAN & animations" },
      { label: "Ateliers & médiation", href: "/services/ateliers", desc: "Actions éducatives & jeunesse" },
      { label: "Consulting & accompagnement", href: "/services/consulting", desc: "Stratégie & production" },
    ],
  },
  {
    label: "Actualités", href: "/actualites", children: [
      { label: "Actualités", href: "/actualites", desc: "Le média Eden & esport" },
      { label: "Blog", href: "/blog", desc: "Guides, analyses & coulisses" },
    ],
  },
  { label: "Boutique", href: "/boutique" },
  { label: "Partenaires", href: "/partenaires" },
];

// Regroupe les sous-routes sous l'onglet parent pour l'état actif.
const GROUP: Record<string, string> = {
  "/eden": "/eden", "/notre-equipe": "/eden",
  "/esport": "/esport", "/equipes": "/esport", "/joueurs": "/esport",
  "/evenements": "/evenements",
  "/actions": "/actions", "/services": "/actions",
  "/actualites": "/actualites", "/blog": "/actualites",
  "/boutique": "/boutique", "/panier": "/boutique",
  "/partenaires": "/partenaires",
};

function activeHref(pathname: string): string | null {
  const seg = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  return GROUP[seg] ?? null;
}

export default function Header() {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const active = activeHref(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Ferme les menus à chaque changement de page
  useEffect(() => { setOpen(false); setOpenSub(null); }, [pathname]);

  return (
    <>
      <header className={"header" + (scrolled ? " scrolled" : "")}>
        <div className="wrap">
          <Link href="/" className="brand" aria-label="Eden Esport — accueil">
            <img src="/symbol.png" alt="" width={38} aria-hidden="true" />
            <span className="wm">EDEN<small>E-SPORT</small></span>
          </Link>

          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((item) => (
              <div className={"nav-item" + (item.children ? " has-menu" : "")} key={item.href + item.label}>
                <Link href={item.href} className={active === item.href ? "on" : ""}>
                  {item.label}
                  {item.children && <span className="caret" aria-hidden="true"></span>}
                </Link>
                {item.children && (
                  <div className="nav-panel" role="menu">
                    <div className="nav-panel-inner">
                      {item.children.map((c) => (
                        <Link key={c.href + c.label} href={c.href} className="nav-sub" role="menuitem">
                          <span className="nav-sub-label">{c.label}</span>
                          {c.desc && <span className="nav-sub-desc">{c.desc}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header-cta">
            <CartBadge />
            <Link href="/rejoindre" className="btn btn--sm">Rejoindre Eden<span className="arw">→</span></Link>
            <button className="burger" aria-label="Ouvrir le menu" aria-expanded={open}
              onClick={() => setOpen((v) => !v)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={!open}>
        {NAV.map((item, i) => (
          <div className="mm-item" key={item.href + item.label}>
            <div className="mm-row">
              <Link href={item.href} className="mm-main">{item.label} <span>{String(i + 1).padStart(2, "0")}</span></Link>
              {item.children && (
                <button className={"mm-toggle" + (openSub === item.label ? " open" : "")} type="button"
                  aria-label={`Sous-menu ${item.label}`} aria-expanded={openSub === item.label}
                  onClick={() => setOpenSub((v) => (v === item.label ? null : item.label))}>
                  <span className="caret" aria-hidden="true"></span>
                </button>
              )}
            </div>
            {item.children && openSub === item.label && (
              <div className="mm-sub">
                {item.children.map((c) => (
                  <Link key={c.href + c.label} href={c.href}>{c.label}</Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <Link href="/rejoindre" className="btn">Rejoindre Eden<span className="arw">→</span></Link>
      </div>
    </>
  );
}
