import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeam, getTeams } from "@/lib/content";
import { Breadcrumb } from "@/components/ui";

export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeam(slug);
  return { title: team ? team.name : "Équipe" };
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeam(slug);
  if (!team) notFound();

  return (
    <>
      <div className={"page-hero " + team.cls}><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Équipes", href: "/equipes" }, { label: team.name }]} />
        <span className="tag tag--gold"><span className="dot"></span>{team.status}</span>
        <p className="eyebrow" style={{ marginTop: "1rem" }}>{team.game}</p>
        <h1>{team.name}</h1>
        <p className="lead">{team.description}</p>
      </div></div>

      <section className="section"><div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Roster</p>
          <h2 style={{ fontSize: "var(--fs-h2)" }}>Les joueurs</h2>
          <p className="tmp">Effectif en cours de constitution.</p>
        </div>
        <div className="roster">
          {team.roster.map((p) => (
            <Link className="player-card" href={`/joueurs/${p.slug}`} key={p.slug}>
              <div className="player-avatar"><span className="ini">{p.initials}</span><span className="tag role">{p.role}</span></div>
              <div className="pc-body"><div className="pseudo">{p.pseudo}</div><div className="game">{p.role}</div></div>
            </Link>
          ))}
        </div>
      </div></section>

      {team.staff.length > 0 && (
      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-head"><p className="eyebrow">Encadrement</p><h2 style={{ fontSize: "var(--fs-h2)" }}>Le staff</h2></div>
        <div className="grid-3">
          {team.staff.map((s) => (
            <div className="panel" key={s.name + s.role}><h3 style={{ fontSize: "1.05rem" }}>{s.name}</h3><p>{s.role}</p></div>
          ))}
        </div>
      </div></section>
      )}

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap grid-2">
        <div>
          <p className="eyebrow">Agenda</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Prochains matchs</h2>
          <div className="match"><span className="comp">À programmer</span><span className="teams">{team.name} — À définir</span><span className="date">Bientôt</span></div>
        </div>
        <div>
          <p className="eyebrow">Palmarès</p><h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1rem" }}>Résultats</h2>
          <div className="panel"><p>La saison démarre. Les résultats officiels seront ajoutés ici — aucun résultat inventé.</p></div>
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap" style={{ textAlign: "center" }}>
        <Link href="/rejoindre" className="btn">Rejoindre cette équipe<span className="arw">→</span></Link>
      </div></section>
    </>
  );
}
