"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { EventCard } from "./cards";
import Countdown from "./Countdown";

function isUpcoming(e: Event): boolean {
  if (e.iso) return new Date(e.iso).getTime() >= Date.now();
  return e.status === "upcoming";
}
function ts(e: Event): number {
  return e.iso ? new Date(e.iso).getTime() : 0;
}

export default function EventsExplorer({ events }: { events: Event[] }) {
  const [f, setF] = useState("all");

  const next = useMemo(() => {
    return events.filter(isUpcoming).sort((a, b) => ts(a) - ts(b))[0] || null;
  }, [events]);

  const cats = useMemo(() => Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[], [events]);

  const filtered = events.filter((e) => {
    if (f === "all") return true;
    if (f === "upcoming") return isUpcoming(e);
    if (f === "past") return !isUpcoming(e);
    return e.category === f;
  });

  const timeline = useMemo(() => [...events].sort((a, b) => ts(a) - ts(b)), [events]);

  return (
    <>
      {/* COMPTE À REBOURS */}
      {next && (
        <div className="ev-countdown">
          <div>
            <p className="eyebrow eyebrow--gold">Prochain rendez-vous</p>
            <h2 style={{ fontSize: "clamp(1.6rem,3.4vw,2.4rem)" }}>{next.title}</h2>
            <p className="muted" style={{ marginTop: ".3rem" }}>{next.date} · {next.place}</p>
          </div>
          <div>
            {next.iso && <Countdown iso={next.iso} />}
            <div style={{ marginTop: "1rem" }}><Link href={`/evenements/${next.slug}`} className="btn btn--sm">Voir l&apos;événement<span className="arw">→</span></Link></div>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="filter-bar" style={{ marginTop: "2.4rem" }}>
        <button className={f === "all" ? "on" : ""} onClick={() => setF("all")} type="button">Tous</button>
        <button className={f === "upcoming" ? "on" : ""} onClick={() => setF("upcoming")} type="button">À venir</button>
        <button className={f === "past" ? "on" : ""} onClick={() => setF("past")} type="button">Passés</button>
        {cats.map((c) => (
          <button key={c} className={f === c ? "on" : ""} onClick={() => setF(c)} type="button">{c}</button>
        ))}
      </div>

      {/* CARTES */}
      <div className="grid-2">
        {filtered.map((e) => <EventCard key={e.slug} event={e} />)}
      </div>
      {filtered.length === 0 && <p className="tmp" style={{ marginTop: "1rem" }}>Aucun événement dans cette catégorie pour l&apos;instant.</p>}

      {/* FRISE CHRONOLOGIQUE */}
      <div className="es-block" style={{ marginTop: "3.5rem" }}>
        <p className="eyebrow">La chronologie</p>
        <div className="ev-timeline">
          {timeline.map((e) => (
            <Link href={`/evenements/${e.slug}`} className={"ev-tl-item" + (isUpcoming(e) ? " up" : "") + (next && e.slug === next.slug ? " next" : "")} key={e.slug}>
              <div className="ev-tl-dot" aria-hidden="true"></div>
              <div className="ev-tl-body">
                <div className="ev-tl-date">{e.date}{next && e.slug === next.slug && <span className="next-badge" style={{ position: "static", marginLeft: ".6rem" }}>Prochain</span>}</div>
                <h4>{e.title}</h4>
                <p className="muted">{e.category ? e.category + " · " : ""}{e.place}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
