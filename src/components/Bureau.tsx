"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";

const supabase = getSupabase();

const eur = (n: number) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fmtD = (d?: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "");

type Field = { key: string; label: string; type?: "text" | "number" | "date" | "select" | "bool" | "textarea"; options?: string[] };

/* ================================================================
   MOTEUR GÉNÉRIQUE — liste + ajout + suppression d'enregistrements
   ================================================================ */
function Crud({ table, fields, defaults = {}, filter, orderBy = "created_at", desc = true, summary }: {
  table: string; fields: Field[]; defaults?: Record<string, unknown>;
  filter?: (r: Record<string, unknown>) => boolean; orderBy?: string; desc?: boolean;
  summary?: (rows: Record<string, unknown>[]) => React.ReactNode;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Record<string, unknown>>({ ...defaults });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const q = await supabase.from(table).select("*").order(orderBy, { ascending: !desc });
    if (q.error) { setErr(true); setRows([]); }
    else { setErr(false); setRows(((q.data as Record<string, unknown>[]) || []).filter((r) => (filter ? filter(r) : true))); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  useEffect(() => { load(); }, [load]);

  const setV = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const payload: Record<string, unknown> = { ...defaults };
    for (const fl of fields) {
      let v = f[fl.key];
      if (fl.type === "number") v = v === "" || v == null ? null : Number(v);
      else if (fl.type === "bool") v = !!v;
      else if (v === "") v = null;
      payload[fl.key] = v;
    }
    const { error } = await supabase.from(table).insert(payload);
    setSaving(false);
    if (!error) { setF({ ...defaults }); setOpen(false); load(); }
    else alert("Enregistrement impossible : " + error.message);
  }
  async function del(id: unknown) {
    if (!supabase || !confirm("Supprimer cette ligne ?")) return;
    await supabase.from(table).delete().eq("id", id);
    load();
  }
  async function toggleBool(row: Record<string, unknown>, key: string) {
    if (!supabase) return;
    await supabase.from(table).update({ [key]: !row[key] }).eq("id", row.id);
    load();
  }

  if (err) return <div className="bu-empty">Module non activé (table « {table} » absente). Lance le SQL fourni dans Supabase.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;

  return (
    <div>
      {summary && <div className="bu-summary">{summary(rows)}</div>}
      <div className="bu-toolbar">
        <button className="bu-btn" onClick={() => setOpen((o) => !o)}>{open ? "Fermer" : "+ Ajouter"}</button>
        <span className="bu-count">{rows.length} entrée{rows.length > 1 ? "s" : ""}</span>
      </div>
      {open && (
        <form className="bu-form" onSubmit={add}>
          {fields.map((fl) => (
            <label key={fl.key} className={"bu-field" + (fl.type === "textarea" ? " bu-field--wide" : "")}>
              <span>{fl.label}</span>
              {fl.type === "textarea" ? (
                <textarea value={(f[fl.key] as string) || ""} onChange={(e) => setV(fl.key, e.target.value)} />
              ) : fl.type === "bool" ? (
                <input type="checkbox" checked={!!f[fl.key]} onChange={(e) => setV(fl.key, e.target.checked)} />
              ) : fl.type === "select" ? (
                <select value={(f[fl.key] as string) || ""} onChange={(e) => setV(fl.key, e.target.value)}>
                  <option value="">—</option>
                  {(fl.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={fl.type === "number" ? "number" : fl.type === "date" ? "date" : "text"}
                  value={(f[fl.key] as string) ?? ""} onChange={(e) => setV(fl.key, e.target.value)} />
              )}
            </label>
          ))}
          <button className="bu-btn" type="submit" disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
        </form>
      )}
      <div className="bu-tablewrap">
        <table className="bu-table">
          <thead><tr>{fields.map((fl) => <th key={fl.key}>{fl.label}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={fields.length + 1} className="bu-muted">Aucune entrée pour l&apos;instant.</td></tr>
            ) : rows.map((r) => (
              <tr key={String(r.id)}>
                {fields.map((fl) => (
                  <td key={fl.key}>
                    {fl.type === "bool" ? (
                      <button className={"bu-chip " + (r[fl.key] ? "ok" : "no")} onClick={() => toggleBool(r, fl.key)}>{r[fl.key] ? "Oui" : "Non"}</button>
                    ) : fl.type === "number" ? (
                      /amount|planned|montant|prix/.test(fl.key) ? eur(r[fl.key] as number) : (r[fl.key] as string) ?? ""
                    ) : fl.type === "date" ? fmtD(r[fl.key] as string) : ((r[fl.key] as string) ?? "")}
                  </td>
                ))}
                <td><button className="bu-del" onClick={() => del(r.id)} aria-label="Supprimer">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return <div className={"bu-kpi" + (tone ? " bu-kpi--" + tone : "")}><span className="bu-kpi-v">{value}</span><span className="bu-kpi-l">{label}</span></div>;
}

const financeSummary = (rows: Record<string, unknown>[]) => {
  const rec = rows.filter((r) => r.kind === "Recette").reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const dep = rows.filter((r) => r.kind === "Dépense").reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return <div className="bu-kpis"><Kpi label="Recettes" value={eur(rec)} tone="pos" /><Kpi label="Dépenses" value={eur(dep)} tone="neg" /><Kpi label="Solde" value={eur(rec - dep)} /></div>;
};

/* ================================================================
   TABLEAU DE BORD
   ================================================================ */
function DashboardBureau() {
  const [k, setK] = useState<{ members?: number; duesPaid?: number; solde?: number; docs?: number } | null>(null);
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const [m, d, fe, doc] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("dues").select("paid"),
        supabase.from("finance_entries").select("kind,amount"),
        supabase.from("documents").select("id", { count: "exact", head: true }),
      ]);
      const dues = (d.data as { paid: boolean }[]) || [];
      const fin = (fe.data as { kind: string; amount: number }[]) || [];
      const rec = fin.filter((x) => x.kind === "Recette").reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const dep = fin.filter((x) => x.kind === "Dépense").reduce((s, x) => s + (Number(x.amount) || 0), 0);
      setK({ members: m.count ?? 0, duesPaid: dues.filter((x) => x.paid).length, solde: rec - dep, docs: doc.count ?? 0 });
    })();
  }, []);
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: "1rem" }}>Vue d&apos;ensemble de l&apos;association.</p>
      <div className="bu-kpis">
        <Kpi label="Adhérents" value={k ? String(k.members) : "…"} />
        <Kpi label="Cotisations à jour" value={k ? String(k.duesPaid) : "…"} tone="pos" />
        <Kpi label="Solde" value={k ? eur(k.solde || 0) : "…"} />
        <Kpi label="Documents" value={k ? String(k.docs) : "…"} />
      </div>
      <div className="bu-empty" style={{ marginTop: "1.4rem" }}>
        Utilise le menu à gauche pour gérer les adhérents, la finance, les documents, les partenaires et le matériel de l&apos;association.
      </div>
    </div>
  );
}

/* ================================================================
   GESTION DES ACCÈS (Administration → Utilisateurs)
   ================================================================ */
function UsersModule() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const q = await supabase.from("profiles").select("id,pseudo,role,is_bureau").order("pseudo");
    if (q.error) setErr(true); else setRows((q.data as Record<string, unknown>[]) || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function toggle(r: Record<string, unknown>) {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_bureau", { target: r.id, val: !r.is_bureau });
    if (error) alert("Modification impossible : " + error.message);
    load();
  }
  if (err) return <div className="bu-empty">Colonne « is_bureau » absente. Lance le SQL fourni.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Donne ou retire l&apos;accès au bureau. (Les rôles joueur/staff de l&apos;espace équipe ne sont pas affectés.)</p>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Membre</th><th>Rôle équipe</th><th>Accès bureau</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={String(r.id)}>
            <td>{(r.pseudo as string) || "—"}</td>
            <td>{(r.role as string) === "staff" ? "Staff" : "Joueur"}</td>
            <td><button className={"bu-chip " + (r.is_bureau ? "ok" : "no")} onClick={() => toggle(r)}>{r.is_bureau ? "Oui" : "Non"}</button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div className="bu-empty">Le module <strong>{label}</strong> arrive bientôt. La structure est en place — dis-moi de le développer quand tu veux.</div>;
}

/* ================================================================
   NAVIGATION
   ================================================================ */
const DOC_CATS = ["Statuts", "PV / réunion", "Subvention", "Administratif"];
const memberFields: Field[] = [
  { key: "last_name", label: "Nom" }, { key: "first_name", label: "Prénom" },
  { key: "email", label: "E-mail" }, { key: "phone", label: "Téléphone" },
  { key: "status", label: "Statut", type: "select", options: ["Actif", "Inactif"] },
  { key: "notes", label: "Notes", type: "textarea" },
];
const duesFields: Field[] = [
  { key: "member", label: "Membre" }, { key: "season", label: "Saison" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "paid", label: "Payée", type: "bool" }, { key: "method", label: "Moyen" },
];
const financeFields: Field[] = [
  { key: "entry_date", label: "Date", type: "date" },
  { key: "kind", label: "Type", type: "select", options: ["Recette", "Dépense"] },
  { key: "label", label: "Libellé" }, { key: "category", label: "Catégorie" },
  { key: "amount", label: "Montant", type: "number" }, { key: "notes", label: "Notes", type: "textarea" },
];
const docFields = (cat: string): Field[] => [
  { key: "title", label: "Titre" }, { key: "link", label: "Lien" },
  { key: "doc_date", label: "Date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" },
  { key: "category", label: "Catégorie", type: "select", options: DOC_CATS },
];

type Sub = { key: string; label: string; render: () => React.ReactNode };
type Section = { key: string; icon: string; label: string; subs: Sub[] };

const SECTIONS: Section[] = [
  { key: "dash", icon: "🏠", label: "Tableau de bord", subs: [{ key: "d", label: "Vue d'ensemble", render: () => <DashboardBureau /> }] },
  { key: "adherents", icon: "👥", label: "Adhérents", subs: [
    { key: "liste", label: "Liste des membres", render: () => <Crud table="members" fields={memberFields} orderBy="last_name" desc={false} /> },
    { key: "cotis", label: "Cotisations", render: () => <Crud table="dues" fields={duesFields} /> },
    { key: "docs", label: "Documents", render: () => <Crud table="documents" fields={docFields("Administratif")} filter={(r) => r.category === "Administratif"} defaults={{ category: "Administratif" }} /> },
  ] },
  { key: "finance", icon: "💰", label: "Finance", subs: [
    { key: "recettes", label: "Recettes", render: () => <Crud table="finance_entries" fields={financeFields} filter={(r) => r.kind === "Recette"} defaults={{ kind: "Recette" }} orderBy="entry_date" /> },
    { key: "depenses", label: "Dépenses", render: () => <Crud table="finance_entries" fields={financeFields} filter={(r) => r.kind === "Dépense"} defaults={{ kind: "Dépense" }} orderBy="entry_date" /> },
    { key: "factures", label: "Factures", render: () => <Placeholder label="Factures" /> },
    { key: "budget", label: "Budget & solde", render: () => <Crud table="finance_entries" fields={financeFields} orderBy="entry_date" summary={financeSummary} /> },
  ] },
  { key: "events", icon: "📅", label: "Événements", subs: [
    { key: "cal", label: "Calendrier", render: () => <Placeholder label="Calendrier événements" /> },
    { key: "part", label: "Participants", render: () => <Placeholder label="Participants" /> },
    { key: "orga", label: "Organisation", render: () => <Placeholder label="Organisation" /> },
  ] },
  { key: "docs", icon: "📄", label: "Documents", subs: DOC_CATS.map((c) => ({
    key: c, label: c, render: () => <Crud table="documents" fields={docFields(c)} filter={(r) => r.category === c} defaults={{ category: c }} orderBy="doc_date" />,
  })) },
  { key: "partners", icon: "🤝", label: "Partenaires", subs: [
    { key: "contacts", label: "Contacts", render: () => <Crud table="partner_contacts" fields={[
      { key: "name", label: "Partenaire" }, { key: "contact_name", label: "Contact" },
      { key: "email", label: "E-mail" }, { key: "phone", label: "Téléphone" },
      { key: "status", label: "Statut", type: "select", options: ["Prospect", "Actif", "Terminé"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ]} orderBy="name" desc={false} /> },
    { key: "contrats", label: "Contrats", render: () => <Placeholder label="Contrats" /> },
    { key: "suivi", label: "Suivi", render: () => <Placeholder label="Suivi" /> },
  ] },
  { key: "teams", icon: "🎮", label: "Équipes", subs: [
    { key: "j", label: "Joueurs & staff", render: () => <div className="bu-empty">Les joueurs, le staff et les disponibilités se gèrent dans l&apos;<a href="/espace" style={{ color: "var(--lavender)" }}>espace équipe</a>.</div> },
    { key: "compet", label: "Compétitions", render: () => <Placeholder label="Compétitions" /> },
  ] },
  { key: "material", icon: "📦", label: "Matériel", subs: [
    { key: "inv", label: "Inventaire", render: () => <Crud table="equipment" fields={[
      { key: "name", label: "Matériel" }, { key: "category", label: "Catégorie" },
      { key: "quantity", label: "Quantité", type: "number" },
      { key: "status", label: "État", type: "select", options: ["Neuf", "Bon", "Usé", "HS"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ]} orderBy="name" desc={false} /> },
    { key: "prets", label: "Prêts", render: () => <Crud table="loans" fields={[
      { key: "item", label: "Matériel" }, { key: "borrower", label: "Emprunteur" },
      { key: "out_date", label: "Sortie", type: "date" }, { key: "due_date", label: "Retour prévu", type: "date" },
      { key: "returned", label: "Rendu", type: "bool" },
    ]} orderBy="out_date" /> },
  ] },
  { key: "admin", icon: "⚙️", label: "Administration", subs: [
    { key: "users", label: "Utilisateurs & accès", render: () => <UsersModule /> },
    { key: "roles", label: "Rôles / permissions", render: () => <Placeholder label="Rôles / permissions" /> },
    { key: "journal", label: "Journal des actions", render: () => <Placeholder label="Journal des actions" /> },
  ] },
];

/* ================================================================
   APPLI BUREAU (shell)
   ================================================================ */
function BureauApp({ pseudo, onLogout }: { pseudo: string; onLogout: () => void }) {
  const [sec, setSec] = useState("dash");
  const [sub, setSub] = useState("d");
  const [navOpen, setNavOpen] = useState(false);
  const section = SECTIONS.find((s) => s.key === sec) || SECTIONS[0];
  const current = section.subs.find((x) => x.key === sub) || section.subs[0];

  const go = (sKey: string, subKey: string) => { setSec(sKey); setSub(subKey); setNavOpen(false); };

  return (
    <div className="bu-shell">
      <button className="bu-burger" onClick={() => setNavOpen((v) => !v)}>☰ Menu</button>
      <aside className={"bu-side" + (navOpen ? " open" : "")}>
        <div className="bu-brand">Bureau · Eden</div>
        <nav>
          {SECTIONS.map((s) => (
            <div key={s.key} className="bu-navgroup">
              <button className={"bu-navsec" + (s.key === sec ? " on" : "")} onClick={() => go(s.key, s.subs[0].key)}>
                <span>{s.icon}</span> {s.label}
              </button>
              {s.key === sec && (
                <div className="bu-navsubs">
                  {s.subs.map((x) => (
                    <button key={x.key} className={"bu-navsub" + (x.key === sub ? " on" : "")} onClick={() => go(s.key, x.key)}>{x.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="bu-side-foot">
          <div className="bu-muted" style={{ fontSize: ".8rem" }}>{pseudo}</div>
          <button className="bu-btn bu-btn--ghost" onClick={onLogout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="bu-main">
        <div className="bu-head">
          <h1>{section.icon} {section.label}</h1>
          <span className="bu-crumb">{current.label}</span>
        </div>
        {current.render()}
      </main>
    </div>
  );
}

/* ---- connexion ---- */
function LoginBureau() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle"); const [msg, setMsg] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return; setState("sending");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setState("error"); setMsg(/invalid/i.test(error.message) ? "E-mail ou mot de passe incorrect." : "Connexion impossible."); }
  }
  return (
    <div className="esp-card esp-center" style={{ maxWidth: 460, margin: "3rem auto" }}>
      <h2>Espace bureau</h2>
      <p className="muted">Réservé aux membres du bureau d&apos;Eden Esport.</p>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: "1rem" }}>
        <div className="field"><label>E-mail</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div className="field"><label>Mot de passe</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {state === "error" && <div className="form-ok form-err show" role="alert">{msg}</div>}
        <div><button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Connexion…" : "Se connecter"}<span className="arw">→</span></button></div>
      </form>
    </div>
  );
}

export default function Bureau() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<{ id: string; pseudo: string; is_bureau?: boolean } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setProfile(null); setReady(true); return; }
    let r = await supabase.from("profiles").select("id,pseudo,is_bureau").eq("id", session.user.id).maybeSingle();
    if (r.error) r = await supabase.from("profiles").select("id,pseudo").eq("id", session.user.id).maybeSingle();
    setProfile((r.data as { id: string; pseudo: string; is_bureau?: boolean }) || null);
    setReady(true);
  }, []);

  useEffect(() => {
    loadProfile();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadProfile());
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const logout = async () => { if (supabase) await supabase.auth.signOut(); setProfile(null); };

  if (!SUPABASE_ENABLED) return <div className="esp-card esp-center"><h2>Espace bureau — en préparation</h2><p className="muted">Bientôt disponible.</p></div>;
  if (!ready) return <p className="muted">Chargement…</p>;
  if (!profile) return <LoginBureau />;
  if (!profile.is_bureau) {
    return (
      <div className="esp-card esp-center" style={{ maxWidth: 480, margin: "3rem auto" }}>
        <h2>Accès réservé au bureau</h2>
        <p className="muted">Ton compte n&apos;a pas (encore) accès à l&apos;espace bureau. Un membre du bureau peut te l&apos;accorder dans Administration → Utilisateurs.</p>
        <button className="btn btn--ghost btn--sm" onClick={logout} style={{ marginTop: "1rem" }}>Se déconnecter</button>
      </div>
    );
  }
  return <BureauApp pseudo={profile.pseudo} onLogout={logout} />;
}
