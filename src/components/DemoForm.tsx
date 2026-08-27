"use client";
import { useState, type ReactNode } from "react";
import { WEB3FORMS_ACCESS_KEY } from "@/lib/forms";

type State = "idle" | "sending" | "ok" | "error";

export default function DemoForm({
  children, submitLabel, okText, subject,
}: { children: ReactNode; submitLabel: string; okText: string; subject?: string }) {
  const [state, setState] = useState<State>("idle");
  const configured = !!WEB3FORMS_ACCESS_KEY;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    // Pas encore de clé → mode démonstration (rien n'est envoyé)
    if (!configured) { setState("ok"); form.reset(); return; }

    setState("sending");
    try {
      const data = new FormData(form);
      data.append("access_key", WEB3FORMS_ACCESS_KEY);
      data.append("from_name", "Site Eden Esport");
      if (subject) data.append("subject", subject);
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
      const json = await res.json();
      if (json.success) { setState("ok"); form.reset(); }
      else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {children}

      {/* anti-spam (piège à robots, invisible) */}
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" />

      {state === "ok" && <div className="form-ok show" role="status">{okText}</div>}
      {state === "error" && (
        <div className="form-ok form-err show" role="alert">
          Oups, l&apos;envoi a échoué. Réessaie, ou écris-nous directement par email.
        </div>
      )}

      <div>
        <button className="btn" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Envoi en cours…" : submitLabel}<span className="arw">→</span>
        </button>
      </div>

      {!configured && (
        <p className="form-note">Formulaire de démonstration — ajoute ta clé Web3Forms dans <code>src/lib/forms.ts</code> pour recevoir les messages par email.</p>
      )}
    </form>
  );
}
