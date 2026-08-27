import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/ui";
import DemoForm from "@/components/DemoForm";

export const metadata: Metadata = { title: "Rejoindre Eden" };

const ROLES: [string, React.ReactNode][] = [
  ["Joueurs", "Valorant, LoL & futurs jeux."],
  ["Coachs & analystes", "Encadrer et faire progresser."],
  ["Managers & staff", "Structurer le quotidien des équipes."],
  ["Créateurs de contenu", "Streaming, montage, social media."],
  ["Bénévoles", <>Donner un coup de main. <Link href="/benevole" style={{ color: "var(--lavender)" }}>En savoir plus →</Link></>],
  ["Événementiel", "Organiser et animer nos rendez-vous."],
  ["Communication", "Faire rayonner la marque Eden."],
  ["Partenaires", <>Construire ensemble. <Link href="/partenaires" style={{ color: "var(--lavender)" }}>Devenir partenaire →</Link></>],
];

export default function RejoindrePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Rejoindre" }]}
        eyebrow="On recrute" eyebrowGold title="Rejoindre Eden"
        lead="À l'instant précis où tout se construit, il y a une place pour toi. Choisis ta voie et postule."
      />
      <section className="section"><div className="wrap">
        <div className="grid-4">
          {ROLES.map(([t, d]) => <div className="panel" key={t}><h3>{t}</h3><p>{d}</p></div>)}
        </div>
        <div style={{ marginTop: "3rem" }}>
          <SectionHead eyebrow="Candidature" title="Postule en 2 minutes" />
          <DemoForm submitLabel="Envoyer ma candidature" subject="Nouvelle candidature — Rejoindre Eden" okText="Merci ! Ta candidature a bien été envoyée. Nous revenons vers toi rapidement.">
            <div className="row">
              <div className="field"><label>Prénom</label><input type="text" name="Prénom" required /></div>
              <div className="field"><label>Nom</label><input type="text" name="Nom" required /></div>
            </div>
            <div className="row">
              <div className="field"><label>Email</label><input type="email" name="email" required /></div>
              <div className="field"><label>Je postule comme</label><select name="Poste visé"><option>Joueur</option><option>Coach / Analyste</option><option>Manager / Staff</option><option>Créateur de contenu</option><option>Bénévole</option><option>Communication</option><option>Partenaire</option></select></div>
            </div>
            <div className="field"><label>Pseudo / jeu principal</label><input type="text" name="Pseudo / jeu" /></div>
            <div className="field"><label>Ta motivation</label><textarea name="Motivation" placeholder="Parle-nous de toi, de ton niveau, de tes disponibilités…"></textarea></div>
          </DemoForm>
        </div>
      </div></section>
    </>
  );
}
