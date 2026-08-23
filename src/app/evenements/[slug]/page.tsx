import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getEvents } from "@/lib/content";
import { Breadcrumb } from "@/components/ui";
import Countdown from "@/components/Countdown";

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvent(slug);
  return { title: e ? e.title : "Événement" };
}

const mapSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) notFound();

  const loc = e.address || e.place;
  const hasMap = !!loc && e.place.toLowerCase() !== "en ligne";
  const upcoming = e.iso ? new Date(e.iso).getTime() > Date.now() : e.status === "upcoming";

  return (
    <>
      <div className="page-hero"><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Événements", href: "/evenements" }, { label: e.title }]} />
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".4rem" }}>
          <span className={"tag " + (upcoming ? "tag--live" : "")}><span className="dot"></span>{e.tag}</span>
          {e.category && <span className="tag tag--gold">{e.category}</span>}
        </div>
        <h1 style={{ marginTop: ".4rem" }}>{e.title}</h1>
        <p className="lead">{e.description}</p>
        {upcoming && e.iso && <div style={{ marginTop: "1.4rem" }}><Countdown iso={e.iso} /></div>}
      </div></div>

      <section className="section"><div className="wrap grid-2" style={{ alignItems: "start" }}>
        <div>
          <p className="eyebrow">Programme</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Au programme</h2>
          {e.program.map((pr, i) => (
            <div className="match" key={i}><span className="comp">{pr.time}</span><span className="teams">{pr.label}</span></div>
          ))}
        </div>
        <div>
          <div className="panel">
            <h3>Informations pratiques</h3>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Date :</strong> {e.date}</p>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Lieu :</strong> {e.place}{e.address && e.address !== e.place ? ` — ${e.address}` : ""}</p>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Entrée :</strong> {e.ticketUrl ? "Billetterie ouverte" : "à préciser"}</p>
            {/* BILLETTERIE (prête pour plus tard) */}
            {e.ticketUrl ? (
              <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn--gold" style={{ marginTop: ".6rem" }}>Réserver ma place<span className="arw">→</span></a>
            ) : (
              <span className="btn btn--ghost btn--sm" style={{ marginTop: ".6rem", opacity: 0.7, cursor: "default" }}>Billetterie à venir</span>
            )}
          </div>
        </div>
      </div></section>

      {/* CARTE + SE LOGER / SE RESTAURER */}
      {hasMap && (
        <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
          <p className="eyebrow">Sur place</p>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.4rem" }}>Le lieu & les environs</h2>
          <div className="grid-2" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
            <div className="ev-map">
              <iframe title={`Carte — ${e.place}`} loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(loc)}&output=embed`} />
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div className="info-block">
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 21V9l9-6 9 6v12" /><path d="M9 21v-6h6v6" /></svg></span>
                <div>
                  <h4>Se loger</h4>
                  {e.hotels && e.hotels.length > 0
                    ? e.hotels.map((h) => <p key={h.url}><a href={h.url} target="_blank" rel="noopener noreferrer">{h.name} →</a></p>)
                    : <p><a href={mapSearch("hôtels près de " + loc)} target="_blank" rel="noopener noreferrer">Voir les hôtels à proximité →</a></p>}
                </div>
              </div>
              <div className="info-block">
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 3v7a3 3 0 0 0 6 0V3M7 10v11M17 3c-1.5 0-3 1.5-3 5s1.5 4 3 4v9" /></svg></span>
                <div>
                  <h4>Se restaurer</h4>
                  {e.restaurants && e.restaurants.length > 0
                    ? e.restaurants.map((r) => <p key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name} →</a></p>)
                    : <p><a href={mapSearch("restaurants près de " + loc)} target="_blank" rel="noopener noreferrer">Voir les restaurants à proximité →</a></p>}
                </div>
              </div>
            </div>
          </div>
          <p className="tmp" style={{ marginTop: "1rem" }}>* Emplacement indicatif — précise l&apos;adresse exacte dans le fichier des événements.</p>
        </div></section>
      )}

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap" style={{ textAlign: "center" }}>
        <Link href="/evenements" className="btn btn--ghost">← Tous les événements</Link>
      </div></section>
    </>
  );
}
