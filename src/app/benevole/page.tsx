import type { Metadata } from "next";
import { PageHero, SectionHead } from "@/components/ui";
import DemoForm from "@/components/DemoForm";

export const metadata: Metadata = { title: "Devenir bénévole" };

export default function BenevolePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Rejoindre", href: "/rejoindre" }, { label: "Bénévolat" }]}
        eyebrow="Donne de ton temps" title="Devenir bénévole"
        lead="Le bénévolat est le cœur battant d'Eden. Rejoins une équipe soudée et vis l'esport de l'intérieur."
      />
      <section className="section"><div className="wrap">
        <div className="grid-3">
          <div className="panel"><h3>Pourquoi nous rejoindre</h3><p>Vivre une aventure humaine, apprendre, rencontrer et contribuer à un projet qui a du sens.</p></div>
          <div className="panel"><h3>Missions possibles</h3><p>Événements, accueil, régie, réseaux sociaux, logistique, animation d&apos;ateliers.</p></div>
          <div className="panel"><h3>Aucune expérience requise</h3><p>La motivation et les valeurs comptent avant tout. On te forme sur le reste.</p></div>
        </div>
        <div style={{ marginTop: "3rem" }}>
          <SectionHead eyebrow="Candidature bénévole" title="Rejoins l'équipe" />
          <DemoForm submitLabel="Je deviens bénévole" okText="Merci ! On revient vers toi très vite (démo).">
            <div className="row">
              <div className="field"><label>Prénom & nom</label><input type="text" required /></div>
              <div className="field"><label>Email</label><input type="email" required /></div>
            </div>
            <div className="field"><label>Ce qui te motive</label><textarea placeholder="Disponibilités, envies, compétences…"></textarea></div>
          </DemoForm>
        </div>
      </div></section>
    </>
  );
}
