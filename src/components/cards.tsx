import Link from "next/link";
import type { Team, Player, Article, Product, Event } from "@/lib/types";

export function TeamCard({ team }: { team: Team }) {
  return (
    <Link className={"team-card " + team.cls} data-cat={team.gameKey} href={`/equipes/${team.slug}`}>
      <span className="tag tag--gold corner"><span className="dot"></span>{team.status}</span>
      <span className="game">{team.game}</span>
      <h3>{team.name}</h3>
      <p className="meta">Roster en cours · {team.roster.length} joueurs</p>
      <span className="discover">Découvrir l&apos;équipe <span className="arw">→</span></span>
    </Link>
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
      <div className="player-avatar">
        <span className="ini">{player.initials}</span>
        <span className="tag role">{player.role}</span>
      </div>
      <div className="pc-body">
        <div className="pseudo">{player.pseudo}</div>
        <div className="name">{player.teamName}</div>
        <div className="game">{player.game}</div>
      </div>
    </Link>
  );
}

export function NewsCard({ article }: { article: Article }) {
  return (
    <Link className="news-card" data-cat={article.category} href={`/actualites/${article.slug}`}>
      <div className="news-thumb"><span className="glyph"><img src="/symbol.png" alt="" loading="lazy" /></span></div>
      <div className="news-body">
        <div className="news-meta"><span className="cat">{article.category}</span><span>{article.date}</span></div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <span className="more">Lire l&apos;article <span className="arw">→</span></span>
      </div>
    </Link>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="team-card" data-cat={product.category} href={`/boutique/${product.slug}`}
      style={{ minHeight: 340, justifyContent: "flex-end", background: "radial-gradient(circle at 70% 25%,rgba(125,92,255,.22),transparent 60%),var(--surface)" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: -1, padding: "2rem" }}>
        {product.image === "jersey"
          ? <img src="/jersey.jpg" alt="" style={{ maxHeight: "70%" }} />
          : <img src="/symbol.png" alt="" style={{ width: "42%", opacity: 0.5 }} />}
      </div>
      <span className="game">{product.category}</span>
      <h3 style={{ fontSize: "1.3rem" }}>{product.name}</h3>
      <p className="meta" style={{ marginBottom: ".6rem" }}>{product.price} <span className="tmp">indicatif</span></p>
      <span className="discover">Voir le produit <span className="arw">→</span></span>
    </Link>
  );
}

export function EventCard({ event }: { event: Event }) {
  return (
    <Link className="event-card" data-cat={event.status} href={`/evenements/${event.slug}`} style={{ gridTemplateColumns: ".8fr 1.2fr" }}>
      <div className="event-media"><img src="/symbol.png" alt="" /></div>
      <div className="event-body">
        <span className={"tag " + (event.status === "upcoming" ? "tag--live" : "")}><span className="dot"></span>{event.tag}</span>
        <h3>{event.title}</h3>
        <p className="where">{event.date} · {event.place}</p>
        <p>{event.description}</p>
        <span className="discover" style={{ fontFamily: "var(--f-display)", fontSize: ".74rem", fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--lavender)" }}>Voir l&apos;événement →</span>
      </div>
    </Link>
  );
}
