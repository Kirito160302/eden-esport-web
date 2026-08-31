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
          <div className="info-block"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></svg></span><div><h4>Email</h4><p><a href="mailto:eden.esport.contact@gmail.com">eden.esport.contact@gmail.com</a></p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg></span><div><h4>Suivez Eden</h4><p><a href="https://x.com/EdenEsport01" target="_blank" rel="noopener noreferrer">X</a> · <a href="https://www.instagram.com/eden_esport/" target="_blank" rel="noopener noreferrer">Instagram</a> · <a href="https://www.twitch.tv/edenesport" target="_blank" rel="noopener noreferrer">Twitch</a> · <a href="https://www.youtube.com/@Eden-Esport" target="_blank" rel="noopener noreferrer">YouTube</a> · <a href="https://discord.gg/tkcpAUqHQg" target="_blank" rel="noopener noreferrer">Discord</a></p></div></div>
          <div className="info-block" style={{ marginTop: ".8rem" }}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="10" r="3" /><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" /></svg></span><div><h4>Basés en France</h4><p>Interventions partout en France.</p></div></div>
        </div>
      </div></section>
    </>
  );
}
