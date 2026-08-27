import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import DemoForm from "@/components/DemoForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Contact" }]}
        eyebrow="Parlons" title="Contacter Eden"
        lead="Partenariat, événement, atelier, consulting, recrutement ou presse : dites-nous tout."
      />
      <section className="section"><div className="wrap grid-2" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <DemoForm submitLabel="Envoyer" subject="Nouveau message — Contact Eden Esport" okText="Merci ! Votre message a bien été envoyé. Nous vous répondons rapidement.">
          <div className="row">
            <div className="field"><label>Prénom</label><input type="text" name="Prénom" required /></div>
            <div className="field"><label>Nom</label><input type="text" name="Nom" required /></div>
          </div>
          <div className="row">
            <div className="field"><label>Email</label><input type="email" name="email" required /></div>
            <div className="field"><label>Téléphone</label><input type="tel" name="Téléphone" /></div>
          </div>
          <div className="row">
            <div className="field"><label>Organisation</label><input type="text" name="Organisation" /></div>
            <div className="field"><label>Sujet</label><select name="Sujet"><option>Partenariat</option><option>Événement</option><option>Atelier</option><option>Consulting</option><option>Recrutement</option><option>Presse</option><option>Autre</option></select></div>
          </div>
          <div className="field"><label>Message</label><textarea name="Message" required placeholder="Votre message…"></textarea></div>
        </DemoForm>
        <div>
          <div className="info-block"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></svg></span><div><h4>Email</h4><p>contact@eden-esport.fr <span className="tmp">(à confirmer)</span></p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 5.5A16 16 0 0 0 15.6 4l-.3.5A13 13 0 0 1 18 5.6a13.5 13.5 0 0 0-12 0Q7.3 5 8.4 4.5L8.1 4A16 16 0 0 0 4.5 5.5C2.3 9 1.7 12.4 2 15.8A16 16 0 0 0 6.9 18l.6-.9a10 10 0 0 1-1.6-.8l.4-.3a11.5 11.5 0 0 0 9.4 0l.4.3a10 10 0 0 1-1.6.8l.6.9A16 16 0 0 0 22 15.8c.4-3.9-.6-7.3-2.5-10.3ZM9 14c-.8 0-1.4-.7-1.4-1.6S8.2 10.8 9 10.8s1.4.7 1.4 1.6S9.8 14 9 14Zm6 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6S15.8 14 15 14Z" /></svg></span><div><h4>Discord</h4><p>Rejoins la communauté Eden <span className="tmp">(lien à venir)</span></p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="10" r="3" /><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" /></svg></span><div><h4>Basés en France</h4><p>Interventions partout en France.</p></div></div>
        </div>
      </div></section>
    </>
  );
}
