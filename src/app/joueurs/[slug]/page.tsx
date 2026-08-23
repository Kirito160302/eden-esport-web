import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, getPlayers } from "@/lib/content";
import { Breadcrumb } from "@/components/ui";

export async function generateStaticParams() {
  const players = await getPlayers();
  return players.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPlayer(slug);
  return { title: p ? p.pseudo : "Joueur" };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPlayer(slug);
  if (!p) notFound();
  return (
    <>
      <div className="page-hero"><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Joueurs", href: "/joueurs" }, { label: p.pseudo }]} />
      </div></div>
      <section className="section"><div className="wrap grid-2" style={{ gridTemplateColumns: ".8fr 1.2fr", alignItems: "start" }}>
        <div className="player-avatar" style={{ border: "1px solid var(--line-2)", aspectRatio: "4/5" }}>
          <span className="ini" style={{ fontSize: "4rem" }}>{p.initials}</span>
          <span className="tag role">{p.role}</span>
        </div>
        <div>
          <p className="eyebrow">{p.game} · {p.teamName}</p>
          <h1 style={{ fontSize: "var(--fs-h1)" }}>{p.pseudo}</h1>
          <p className="lead">Rôle : {p.role}. {p.bio}</p>
          <div className="grid-2" style={{ marginTop: "1.6rem" }}>
            <div className="panel"><h3 style={{ fontSize: "1rem" }}>Équipe</h3><p><Link href={`/equipes/${p.teamSlug}`} style={{ color: "var(--lavender)" }}>{p.teamName} →</Link></p></div>
            <div className="panel"><h3 style={{ fontSize: "1rem" }}>Poste</h3><p>{p.role}</p></div>
          </div>
          <div style={{ marginTop: "1.6rem", display: "flex", gap: ".6rem" }}>
            <Link href="/esport" className="btn btn--ghost btn--sm">Voir l&apos;esport</Link>
            <Link href="/joueurs" className="btn btn--sm">Tous les joueurs</Link>
          </div>
        </div>
      </div></section>
    </>
  );
}
