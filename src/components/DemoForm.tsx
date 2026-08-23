"use client";
import { useState, type ReactNode } from "react";

export default function DemoForm({ children, submitLabel, okText }: { children: ReactNode; submitLabel: string; okText: string }) {
  const [ok, setOk] = useState(false);
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); setOk(true); (e.currentTarget as HTMLFormElement).reset(); }}>
      {children}
      <div className={"form-ok" + (ok ? " show" : "")} role="status">{okText}</div>
      <div><button className="btn" type="submit">{submitLabel}<span className="arw">→</span></button></div>
      <p className="form-note">Formulaire de démonstration — à connecter à votre outil (email, Formspree, CRM…).</p>
    </form>
  );
}
