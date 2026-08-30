"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { SPONSORS, CHANNELS } from "@/lib/journal-data";

type PMatch = { date: string; iso?: string; opponent: string; competition: string; game: string; gameKey: string };
type PTournament = { slug: string; title: string; date: string; place: string };
type LiveMatch = { id: number; a: string; aLogo?: string; b: string; bLogo?: string; league: string; time: string; live: boolean; score?: string };
type LiveTournament = { id: number; name: string; league: string; dates: string };
type LiveData = Record<string, { matches: LiveMatch[]; tournaments: LiveTournament[] }>;

function Placeholder({ children }: { children: React.ReactNode }) {
  return <div className="jp-placeholder"><span className="jp-live-dot" aria-hidden="true"></span>{children}</div>;
}

export default function JournalPortal({
  articles, matches, tournaments, live, liveEnabled,
}: { articles: Article[]; matches: PMatch[]; tournaments: PTournament[]; live?: LiveData; liveEnabled?: boolean }) {
  const [ch, setCh] = useState("eden");
  const isEden = ch === "eden";
  const chLabel = CHANNELS.find((c) => c.key === ch)?.label || "";

  const featured = articles[0];
  const rest = articles.slice(1);

  const liveMatches = !isEden ? (live?.[ch]?.matches ?? []) : [];
  const liveTournaments = !isEden ? (live?.[ch]?.tournaments ?? []) : [];

  return (
    <div className="journal">
      {/* COLONNE PRINCIPALE */}
      <div className="journal-main">
        {/* CHAÎNES / JEUX */}
        <div className="ch-tabs" role="tablist" aria-label="Chaînes">
          {CHANNELS.map((c) => (
            <button key={c.key} className={"ch-tab" + (c.key === ch ? " on" : "")} onClick={() => setCh(c.key)} type="button" role="tab" aria-selected={c.key === ch}>
              <span className="ch-ico" style={c.accent ? { background: c.accent } : undefined}>
                {c.key === "eden" ? <img src="/symbol.png" alt="" /> : c.label.charAt(0)}
              </span>
              {c.label}
            </button>
          ))}
        </div>

        {/* MATCHS DU JOUR */}
        <section className="jp-block">
          <div className="jp-head"><h2>Matchs du jour</h2></div>
          {isEden ? (
            matches.length > 0 ? matches.map((m, i) => (
              <div className="match" key={i}>
                <span className="comp">{m.game} · {m.competition}</span>
                <span className="teams">Eden — {m.opponent}</span>
                <span className="date">{m.date}</span>
              </div>
            )) : <Placeholder>Aucun match Eden programmé pour l&apos;instant.</Placeholder>
          ) : liveMatches.length > 0 ? (
            liveMatches.map((m) => (
              <div className="match" key={m.id}>
                <span className="comp">{m.league}</span>
                <span className="teams">
                  {m.aLogo && <img className="jp-team-logo" src={m.aLogo} alt="" />}{m.a}
                  {" — "}
                  {m.b}{m.bLogo && <img className="jp-team-logo" src={m.bLogo} alt="" />}
                  {m.score && <strong style={{ color: "var(--lavender)", marginLeft: ".5rem" }}>{m.score}</strong>}
                </span>
                <span className={"date" + (m.live ? " jp-livenow" : "")}>{m.time}</span>
              </div>
            ))
          ) : (
            <Placeholder>{liveEnabled
              ? <>Aucun match pro {chLabel} programmé pour le moment.</>
              : <>Matchs pros {chLabel} — <strong>données live à activer</strong> (clé PandaScore).</>}
            </Placeholder>
          )}
        </section>

        {/* ACTUALITÉS */}
        <section className="jp-block">
          <div className="jp-head"><h2>{isEden ? "Actualités Eden" : `Actualités ${chLabel} & Eden`}</h2><Link href="/blog" className="jp-seeall">Voir tout →</Link></div>
          {!isEden && <Placeholder>L&apos;actu mondiale {chLabel} en direct — <strong>bientôt</strong> (agrégation à brancher). En attendant, l&apos;actu Eden ci-dessous.</Placeholder>}
          {featured && (
            <Link href={`/actualites/${featured.slug}`} className="jp-featured">
              <div className="jp-feat-thumb"><span className="glyph"><img src="/symbol.png" alt="" /></span></div>
              <div className="jp-feat-body">
                <div className="news-meta"><span className="cat">{featured.category}</span><span>{featured.date}</span></div>
                <h3>{featured.title}</h3>
                <p>{featured.excerpt}</p>
                <span className="more">Lire l&apos;article <span className="arw">→</span></span>
              </div>
            </Link>
          )}
          <div className="jp-list">
            {rest.map((a) => (
              <Link href={`/actualites/${a.slug}`} className="jp-row" key={a.slug}>
                <span className="jp-row-thumb"><img src="/symbol.png" alt="" /></span>
                <span className="jp-row-body">
                  <span className="jp-row-meta"><span className="cat">{a.category}</span> · {a.date}</span>
                  <span className="jp-row-title">{a.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* TOURNOIS EN COURS */}
        <section className="jp-block">
          <div className="jp-head"><h2>Tournois en cours</h2></div>
          {isEden ? (
            tournaments.length > 0 ? tournaments.map((t) => (
              <Link href={`/evenements/${t.slug}`} className="match" key={t.slug} style={{ textDecoration: "none" }}>
                <span className="comp">Tournoi</span>
                <span className="teams">{t.title}</span>
                <span className="date">{t.date} · {t.place}</span>
              </Link>
            )) : <Placeholder>Aucun tournoi Eden en cours.</Placeholder>
          ) : liveTournaments.length > 0 ? (
            liveTournaments.map((t) => (
              <div className="match" key={t.id}>
                <span className="comp">{t.league || "Tournoi"}</span>
                <span className="teams">{t.name}</span>
                <span className="date">{t.dates}</span>
              </div>
            ))
          ) : (
            <Placeholder>{liveEnabled
              ? <>Aucun tournoi {chLabel} en cours actuellement.</>
              : <>Tournois {chLabel} — <strong>données live à activer</strong> (clé PandaScore).</>}
            </Placeholder>
          )}
        </section>
      </div>

      {/* COLONNE SPONSORS */}
      <aside className="journal-side">
        <div className="jp-side-label">Partenaires</div>
        {SPONSORS.length > 0 ? (
          SPONSORS.map((s) => (
            <a key={s.name} href={s.url || "#"} target="_blank" rel="noopener noreferrer" className="jp-ad">
              {s.image ? <img src={s.image} alt={s.name} /> : <span>{s.name}</span>}
            </a>
          ))
        ) : (
          <>
            <div className="jp-ad jp-ad--empty">Emplacement sponsor</div>
            <div className="jp-ad jp-ad--empty">Emplacement sponsor</div>
          </>
        )}
        <Link href="/partenaires" className="btn btn--ghost btn--sm" style={{ width: "100%", justifyContent: "center" }}>Devenir partenaire</Link>
      </aside>
    </div>
  );
}
