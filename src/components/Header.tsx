"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartBadge } from "./shop";

const NAV: [string, string][] = [
  ["Eden", "/eden"],
  ["Esport", "/esport"],
  ["Événements", "/evenements"],
  ["Nos actions", "/actions"],
  ["Actualités", "/actualites"],
  ["Boutique", "/boutique"],
  ["Partenaires", "/partenaires"],
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

  // Ferme le menu à chaque changement de page
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className={"header" + (scrolled ? " scrolled" : "")}>
        <div className="wrap">
          <Link href="/" className="brand" aria-label="Eden Esport — accueil">
            <img src="/symbol.png" alt="" width={38} aria-hidden="true" />
            <span className="wm">EDEN<small>E-SPORT</small></span>
          </Link>
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} className={active === href ? "on" : ""}>{label}</Link>
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
        {NAV.map(([label, href], i) => (
          <Link key={href} href={href}>{label} <span>{String(i + 1).padStart(2, "0")}</span></Link>
        ))}
        <Link href="/rejoindre" className="btn">Rejoindre Eden<span className="arw">→</span></Link>
      </div>
    </>
  );
}
