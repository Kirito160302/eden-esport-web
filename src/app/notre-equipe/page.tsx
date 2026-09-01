import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Notre équipe" };

type Member = { name: string; role: string; img?: string };

const BUREAU: Member[] = [
  { name: "Enzo « Kirito » Gomez", role: "Président", img: "/team/kirito.jpg" },
  { name: "Sébastien Kroner", role: "Vice-président", img: "/team/sebastien.jpg" },
  { name: "Romaric « Roro » Malapeyre", role: "Vice-président", img: "/team/roro.jpg" },
  { name: "Marie-Laure Richard", role: "Secrétaire", img: "/team/marie-laure.jpg" },
  { name: "Poste ouvert", role: "Trésorier" },
];

const POLES: Member[] = [
  { name: "Luc Dinghin", role: "Responsable Esport" },
  { name: "Raenavia", role: "Responsable League of Legends" },
  { name: "Popy", role: "Responsable Valorant" },
  { name: "Romaric Malapeyre", role: "Responsable Académie", img: "/team/roro.jpg" },
  { name: "Romaric Malapeyre", role: "Intendant Esport", img: "/team/roro.jpg" },
  { name: "Enzo Gomez", role: "Responsable Événementiel", img: "/team/kirito.jpg" },
  { name: "Poste ouvert", role: "Community Manager" },
];

function initial(name: string): string {
  if (name === "Poste ouvert") return "?";
  const m = name.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/);
  return (m ? m[0] : "E").toUpperCase();
}

function Card({ name, role, img }: Member, i: number) {
  const open = name === "Poste ouvert";
  return (
    <div className={"player-card" + (open ? " is-open" : "")} key={role + i}>
      <div className="player-avatar">
        {img ? <img src={img} alt={name} /> : <span className="ini">{initial(name)}</span>}
      </div>
      <div className="pc-body">
        <div className="pseudo">{name}</div>
        <div className="name">{role}</div>
      </div>
    </div>
  );
}

export default function NotreEquipePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Eden", href: "/eden" }, { label: "Notre équipe" }]}
        eyebrow="Les visages d'Eden" title="L'équipe"
        lead="Le bureau et les pôles qui font vivre Eden au quotidien : direction, esport, événementiel, académie et communauté."
      />

      <section className="section"><div className="wrap">
        <p className="eyebrow">Le bureau</p>
        <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.6rem" }}>Direction de l'association</h2>
        <div className="grid-4">{BUREAU.map(Card)}</div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <p className="eyebrow">Les pôles</p>
        <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "1.6rem" }}>Esport, événementiel & académie</h2>
        <div className="grid-4">{POLES.map(Card)}</div>
        <p className="tmp" style={{ marginTop: "1.4rem" }}>
          Il reste des postes ouverts (trésorier, community manager…). Envie de rejoindre l'aventure ?{" "}
          <Link href="/rejoindre" style={{ color: "var(--lavender)" }}>Rejoins-nous</Link>.
        </p>
      </div></section>
    </>
  );
}
