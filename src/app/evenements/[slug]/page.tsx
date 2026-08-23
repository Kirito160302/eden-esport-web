import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getEvents } from "@/lib/content";
import { Breadcrumb } from "@/components/ui";

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvent(slug);
  return { title: e ? e.title : "Événement" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) notFound();
  return (
    <>
      <div className="page-hero"><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Événements", href: "/evenements" }, { label: e.title }]} />
        <span className={"tag " + (e.status === "upcoming" ? "tag--live" : "")}><span className="dot"></span>{e.tag}</span>
        <h1 style={{ marginTop: "1rem" }}>{e.title}</h1>
        <p className="lead">{e.description}</p>
      </div></div>
      <section className="section"><div className="wrap grid-2" style={{ alignItems: "start" }}>
        <div>
          <p className="eyebrow">Programme</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Au programme</h2>
          {e.program.map((pr, i) => (
            <div className="match" key={i}><span className="comp">{pr.time}</span><span className="teams">{pr.label}</span></div>
          ))}
          <p className="tmp" style={{ marginTop: ".8rem" }}>* Programme provisoire.</p>
        </div>
        <div>
          <div className="panel">
            <h3>Informations pratiques</h3>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Date :</strong> {e.date}</p>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Lieu :</strong> {e.place}</p>
            <p style={{ margin: ".6rem 0" }}><strong style={{ color: "var(--text)" }}>Entrée :</strong> à préciser</p>
            <Link href="/contact" className="btn btn--sm" style={{ marginTop: "1rem" }}>Être informé<span className="arw">→</span></Link>
          </div>
        </div>
      </div></section>
    </>
  );
}
