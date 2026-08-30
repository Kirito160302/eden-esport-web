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

// Icône de jeu : logo officiel si présent, sinon initiale colorée (jamais d'image cassée).
function GameIcon({ logo, label, accent }: { logo?: string; label: string; accent?: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) return <img src={logo} alt="" onError={() => setErr(true)} />;
  return <span className="ch-letter" style={accent ? { color: accent } : undefined}>{label.charAt(0)}</span>;
}

// Ligne de match live (PandaScore)
function LiveRow({ m }: { m: LiveMatch }) {
  return (
    <div className="jp-match">
      <span className="jp-m-league">{m.league}</span>
      <span className="jp-m-teams">
        <span className="jp-m-team">{m.aLogo && <img src={m.aLogo} alt="" />}<span className="jp-m-name">{m.a}</span></span>
        <span className="jp-m-vs">{m.score || "vs"}</span>
        <span className="jp-m-team"><span className="jp-m-name">{m.b}</span>{m.bLogo && <img src={m.bLogo} alt="" />}</span>
      </span>
      <span className={"jp-m-time" + (m.live ? " live" : "")}>{m.time}</span>
    </div>
  );
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
              <span className={"ch-ico" + (c.key !== "eden" ? " ch-ico--game" : "")}>
                {c.key === "eden" ? <img src="/symbol.png" alt="" /> : <GameIcon logo={c.logo} label={c.label} accent={c.accent} />}
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
            liveMatches.map((m) => <LiveRow m={m} key={m.id} />)
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
