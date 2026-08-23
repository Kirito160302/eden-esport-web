"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import type { Team, Player, Article, Product, Event } from "@/lib/types";
import Modal from "./Modal";

function openOnKey(fn: () => void) {
  return (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
}

/* ---------------- ÉQUIPES ---------------- */
export function TeamCard({ team, href }: { team: Team; href?: string }) {
  const [open, setOpen] = useState(false);
  const target = href ?? `/equipes/${team.slug}`;
  return (
    <>
      <div className={"team-card card-btn " + team.cls} data-cat={team.gameKey} role="button" tabIndex={0}
        onClick={() => setOpen(true)} onKeyDown={openOnKey(() => setOpen(true))}>
        <span className="tag tag--gold corner"><span className="dot"></span>{team.status}</span>
        <span className="game">{team.game}</span>
        <h3>{team.name}</h3>
        <p className="meta">{team.roster.length > 0 ? `${team.roster.length} joueurs` : "Roster en cours"}</p>
        <span className="discover">Plus d&apos;infos <span className="arw">→</span></span>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <span className="game" style={{ color: "var(--lavender)" }}>{team.game}</span>
        <h3 className="modal-title">{team.name}</h3>
        <span className="tag tag--gold"><span className="dot"></span>{team.status}</span>
        <p className="muted" style={{ margin: "1rem 0" }}>{team.description}</p>
        {team.roster.length > 0 ? (
          <div className="modal-roster">
            {team.roster.map((p) => (
              <div className="mr-item" key={p.slug}><span className="ini">{p.initials}</span><span className="mr-name">{p.pseudo}</span><span className="mr-role">{p.role}</span></div>
            ))}
          </div>
        ) : (
          <p className="tmp">Roster en cours de constitution.</p>
        )}
        <div className="modal-actions">
          <Link href={target} className="btn">Voir la page complète<span className="arw">→</span></Link>
        </div>
      </Modal>
    </>
  );
}

export function SoonCard() {
  return (
    <div className="team-card soon" data-cat="soon">
      <div className="inner">
        <span className="plus">+</span>
        <span className="game">Prochaine section</span>
        <h3 style={{ fontSize: "1.3rem" }}>Bientôt annoncée</h3>
        <p className="meta" style={{ margin: 0 }}>De nouveaux jeux rejoindront l&apos;écosystème Eden.</p>
      </div>
    </div>
  );
}

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link className="player-card" data-cat={player.gameKey} href={`/joueurs/${player.slug}`}>
      <div className="player-avatar"><span className="ini">{player.initials}</span><span className="tag role">{player.role}</span></div>
      <div className="pc-body"><div className="pseudo">{player.pseudo}</div><div className="name">{player.teamName}</div><div className="game">{player.game}</div></div>
    </Link>
  );
}

/* ---------------- ACTUALITÉS ---------------- */
export function NewsCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="news-card card-btn" data-cat={article.category} role="button" tabIndex={0}
        onClick={() => setOpen(true)} onKeyDown={openOnKey(() => setOpen(true))}>
        <div className="news-thumb"><span className="glyph"><img src="/symbol.png" alt="" loading="lazy" /></span></div>
        <div className="news-body">
          <div className="news-meta"><span className="cat">{article.category}</span><span>{article.date}</span></div>
          <h3>{article.title}</h3>
          <p>{article.excerpt}</p>
          <span className="more">Aperçu <span className="arw">→</span></span>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="news-meta" style={{ marginBottom: ".6rem" }}><span className="cat" style={{ color: "var(--violet-2)" }}>{article.category}</span><span className="muted">{article.date}</span></div>
        <h3 className="modal-title">{article.title}</h3>
        <p className="muted" style={{ margin: "1rem 0" }}>{article.excerpt}</p>
        <div className="modal-actions">
          <Link href={`/actualites/${article.slug}`} className="btn">Lire l&apos;article<span className="arw">→</span></Link>
        </div>
      </Modal>
    </>
  );
}

/* ---------------- BOUTIQUE ---------------- */
export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const media = product.image === "jersey"
    ? <img src="/jersey.jpg" alt="" style={{ maxHeight: "72%" }} />
    : <img src="/symbol.png" alt="" style={{ width: "42%", opacity: 0.5 }} />;
  return (
    <>
      <div className="team-card card-btn product-card" data-cat={product.category} role="button" tabIndex={0}
        onClick={() => setOpen(true)} onKeyDown={openOnKey(() => setOpen(true))}
        style={{ minHeight: 360, justifyContent: "flex-end", background: "radial-gradient(circle at 70% 25%,rgba(125,92,255,.22),transparent 60%),var(--surface)" }}>
        <div className="product-visual">{media}</div>
        <span className="game">{product.category}</span>
        <h3 style={{ fontSize: "1.3rem" }}>{product.name}</h3>
        <p className="meta" style={{ marginBottom: ".6rem" }}>{product.price} <span className="tmp">indicatif</span></p>
        <span className="discover">Plus d&apos;infos <span className="arw">→</span></span>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="modal-product">
          <div className="modal-product-media">{product.image === "jersey" ? <img src="/jersey.jpg" alt={product.name} /> : <img src="/symbol.png" alt="" style={{ width: "60%", opacity: 0.7 }} />}</div>
          <div>
            <span className="tag tag--gold">{product.category}</span>
            <h3 className="modal-title" style={{ fontSize: "1.4rem" }}>{product.name}</h3>
            <p className="price" style={{ fontSize: "1.4rem" }}>{product.price} <span className="tmp" style={{ fontSize: ".75rem" }}>indicatif</span></p>
            <p className="muted" style={{ margin: ".8rem 0" }}>{product.description}</p>
            <div style={{ fontFamily: "var(--f-display)", fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>Tailles</div>
            <div className="size-opts" style={{ marginTop: ".4rem" }}>{product.sizes.map((s) => <span key={s} className="size-chip">{s}</span>)}</div>
          </div>
        </div>
        <div className="modal-actions">
          <Link href={`/boutique/${product.slug}`} className="btn">Voir le produit<span className="arw">→</span></Link>
        </div>
      </Modal>
    </>
  );
}

/* ---------------- PARTENAIRES ---------------- */
export function PartnerCard({ name, description, url, tier }: { name: string; description?: string; url?: string; tier?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="p-slot p-slot--filled" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={openOnKey(() => setOpen(true))}>{name}</div>
      <Modal open={open} onClose={() => setOpen(false)}>
        {tier && <span className="tag tag--gold">{tier}</span>}
        <h3 className="modal-title">{name}</h3>
        <p className="muted" style={{ margin: "1rem 0" }}>{description || "Partenaire d'Eden Esport."}</p>
        {url && (
          <div className="modal-actions">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn">Visiter le site<span className="arw">→</span></a>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ---------------- ÉVÉNEMENTS ---------------- */
export function EventCard({ event }: { event: Event }) {
  return (
    <Link className="event-card" data-cat={event.status} href={`/evenements/${event.slug}`} style={{ gridTemplateColumns: ".8fr 1.2fr" }}>
      <div className="event-media"><img src="/symbol.png" alt="" /></div>
      <div className="event-body">
        <span style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <span className={"tag " + (event.status === "upcoming" ? "tag--live" : "")}><span className="dot"></span>{event.tag}</span>
          {event.category && <span className="tag tag--gold">{event.category}</span>}
        </span>
        <h3>{event.title}</h3>
        <p className="where">{event.date} · {event.place}</p>
        <p>{event.description}</p>
        <span className="discover" style={{ fontFamily: "var(--f-display)", fontSize: ".74rem", fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--lavender)" }}>Voir l&apos;événement →</span>
      </div>
    </Link>
  );
}
