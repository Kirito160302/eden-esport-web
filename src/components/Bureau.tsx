"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const res = await supabase.from(table).select("*").order(orderBy, { ascending: !desc });
    if (res.error) { setErr(true); setRows([]); }
    else { setErr(false); setRows(((res.data as Record<string, unknown>[]) || []).filter((r) => (filter ? filter(r) : true))); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  useEffect(() => { load(); }, [load]);

  const setV = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const resetForm = () => { setF({ ...defaults }); setEditingId(null); setOpen(false); };
  function startEdit(row: Record<string, unknown>) {
    const nf: Record<string, unknown> = {};
    for (const fl of fields) nf[fl.key] = row[fl.key] ?? (fl.type === "bool" ? false : "");
    setF(nf); setEditingId(row.id); setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const payload: Record<string, unknown> = editingId ? {} : { ...defaults };
    for (const fl of fields) {
      let v = f[fl.key];
      if (fl.type === "number") v = v === "" || v == null ? null : Number(v);
      else if (fl.type === "bool") v = !!v;
      else if (v === "") v = null;
      payload[fl.key] = v;
    }
    const resp = editingId
      ? await supabase.from(table).update(payload).eq("id", editingId)
      : await supabase.from(table).insert(payload);
    setSaving(false);
    if (!resp.error) { logAction(editingId ? "Modification" : "Ajout", payload[fields[0]?.key]); resetForm(); load(); }
    else alert("Enregistrement impossible : " + resp.error.message);
  }
  async function del(id: unknown) {
    if (!supabase || !confirm("Supprimer cette ligne ?")) return;
    await supabase.from(table).delete().eq("id", id);
    logAction("Suppression", id);
    load();
  }
  async function logAction(action: string, detail: unknown) {
    if (!supabase) return;
    try { await supabase.from("activity_log").insert({ action, entity: table, detail: detail == null ? null : String(detail).slice(0, 140) }); } catch { /* table optionnelle */ }
  }
  async function toggleBool(row: Record<string, unknown>, key: string) {
    if (!supabase) return;
    await supabase.from(table).update({ [key]: !row[key] }).eq("id", row.id);
    load();
  }

  // recherche plein-texte simple sur les champs affichés
  const view = q.trim()
    ? rows.filter((r) => fields.some((fl) => String(r[fl.key] ?? "").toLowerCase().includes(q.toLowerCase())))
    : rows;

  function exportCSV() {
    const cell = (r: Record<string, unknown>, fl: Field) => {
      let v: unknown = r[fl.key];
      if (fl.type === "bool") v = v ? "Oui" : "Non";
      if (v == null) v = "";
      const s = String(v).replace(/"/g, '""');
      return /[";\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [fields.map((fl) => fl.label).join(";"), ...view.map((r) => fields.map((fl) => cell(r, fl)).join(";"))];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${table}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (err) return <div className="bu-empty">Module non activé (table « {table} » absente). Lance le SQL fourni dans Supabase.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;

  return (
    <div>
      {summary && <div className="bu-summary">{summary(rows)}</div>}
      <div className="bu-toolbar">
        <button className="bu-btn" onClick={() => (open ? resetForm() : setOpen(true))}>{open ? "Fermer" : "+ Ajouter"}</button>
        <input className="bu-search" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="bu-btn bu-btn--ghost" onClick={exportCSV} disabled={view.length === 0}>Export CSV</button>
        <span className="bu-count">{view.length} / {rows.length}</span>
      </div>
      {open && (
        <form className="bu-form" onSubmit={submit}>
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
          <div style={{ gridColumn: "1/-1", display: "flex", gap: ".6rem" }}>
            <button className="bu-btn" type="submit" disabled={saving}>{saving ? "…" : editingId ? "Modifier" : "Enregistrer"}</button>
            <button className="bu-btn bu-btn--ghost" type="button" onClick={resetForm}>Annuler</button>
          </div>
        </form>
      )}
      <div className="bu-tablewrap">
        <table className="bu-table">
          <thead><tr>{fields.map((fl) => <th key={fl.key}>{fl.label}</th>)}<th></th></tr></thead>
          <tbody>
            {view.length === 0 ? (
              <tr><td colSpan={fields.length + 1} className="bu-muted">Aucune entrée{q ? " pour cette recherche" : " pour l'instant"}.</td></tr>
            ) : view.map((r) => (
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
                <td className="bu-rowact">
                  <button className="bu-edit" onClick={() => startEdit(r)} aria-label="Modifier">✎</button>
                  <button className="bu-del" onClick={() => del(r.id)} aria-label="Supprimer">✕</button>
                </td>
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
    type Q = { data: Record<string, unknown>[] | null; error: unknown };
    let q = (await supabase.from("profiles").select("id,pseudo,role,is_bureau,bureau_role").order("pseudo")) as Q;
    if (q.error) q = (await supabase.from("profiles").select("id,pseudo,role,is_bureau").order("pseudo")) as Q;
    if (q.error) setErr(true); else { setErr(false); setRows(q.data || []); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function toggle(r: Record<string, unknown>) {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_bureau", { target: r.id, val: !r.is_bureau });
    if (error) alert("Modification impossible : " + error.message);
    load();
  }
  async function setRole(r: Record<string, unknown>, role: string) {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_bureau_role", { target: r.id, role_val: role || null });
    if (error) alert("Modification impossible : " + error.message);
    load();
  }
  if (err) return <div className="bu-empty">Colonne « is_bureau » absente. Lance le SQL fourni.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Donne l&apos;accès bureau et attribue un rôle. (Les rôles joueur/staff de l&apos;espace équipe ne sont pas affectés.)</p>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Membre</th><th>Espace équipe</th><th>Accès bureau</th><th>Rôle bureau</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={String(r.id)}>
            <td>{(r.pseudo as string) || "—"}</td>
            <td>{(r.role as string) === "staff" ? "Staff" : "Joueur"}</td>
            <td><button className={"bu-chip " + (r.is_bureau ? "ok" : "no")} onClick={() => toggle(r)}>{r.is_bureau ? "Oui" : "Non"}</button></td>
            <td>
              <select value={(r.bureau_role as string) || ""} onChange={(e) => setRole(r, e.target.value)} disabled={!r.is_bureau}>
                {BUREAU_ROLES.map((ro) => <option key={ro} value={ro}>{ro || "—"}</option>)}
              </select>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function RolesModule() {
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Rôles de référence (attribution dans Administration → Utilisateurs). L&apos;application fine des restrictions par rubrique pourra être activée ensuite.</p>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Rôle</th><th>Accès prévu</th></tr></thead>
        <tbody>{ROLE_MATRIX.map(([role, desc]) => <tr key={role}><td><strong>{role}</strong></td><td>{desc}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

function JournalModule() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [who, setWho] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      setLoading(true);
      const [l, p] = await Promise.all([
        supabase.from("activity_log").select("*").order("at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id,pseudo"),
      ]);
      if (l.error) setErr(true);
      else { setErr(false); setRows((l.data as Record<string, unknown>[]) || []); }
      const m: Record<string, string> = {};
      for (const x of (p.data as { id: string; pseudo: string }[]) || []) m[x.id] = x.pseudo;
      setWho(m);
      setLoading(false);
    })();
  }, []);
  if (err) return <div className="bu-empty">Module non activé (table « activity_log » absente). Lance le SQL fourni.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Historique des actions (ajout, modification, suppression) enregistrées automatiquement.</p>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Rubrique</th><th>Détail</th></tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={5} className="bu-muted">Aucune action enregistrée.</td></tr> :
          rows.map((r) => (
            <tr key={String(r.id)}>
              <td>{new Date(r.at as string).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
              <td>{who[r.actor as string] || "—"}</td>
              <td>{r.action as string}</td>
              <td>{r.entity as string}</td>
              <td>{(r.detail as string) || ""}</td>
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
   MESSAGERIE INTERNE — canaux + messages directs (temps réel)
   ================================================================ */
type ChatChannel = { id: string; name: string; description?: string | null };
type ChatDm = { id: string; user_a: string; user_b: string };
type ChatMsg = { id: string; sender: string; body: string; created_at: string; channel_id?: string | null; dm_id?: string | null };
type Convo = { kind: "channel" | "dm"; id: string; label: string; other?: string };

function MessengerModule() {
  const [meId, setMeId] = useState("");
  const [who, setWho] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [members, setMembers] = useState<{ id: string; pseudo: string }[]>([]);
  const [dms, setDms] = useState<ChatDm[]>([]);
  const [active, setActive] = useState<Convo | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [sending, setSending] = useState(false);
  const [newChan, setNewChan] = useState(false);
  const [chanName, setChanName] = useState("");
  const [showStart, setShowStart] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const boot = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || "";
    setMeId(uid);
    const [ch, pr, dm] = await Promise.all([
      supabase.from("chat_channels").select("*").order("created_at"),
      supabase.from("profiles").select("id,pseudo,is_bureau"),
      supabase.from("chat_dms").select("*"),
    ]);
    if (ch.error) { setErr(true); setLoading(false); return; }
    setErr(false);
    const chs = (ch.data as ChatChannel[]) || [];
    setChannels(chs);
    const profs = (pr.data as { id: string; pseudo: string; is_bureau?: boolean }[]) || [];
    const map: Record<string, string> = {};
    profs.forEach((p) => { map[p.id] = p.pseudo || "—"; });
    setWho(map);
    setMembers(profs.filter((p) => p.is_bureau && p.id !== uid).map((p) => ({ id: p.id, pseudo: p.pseudo || "—" })));
    setDms((dm.data as ChatDm[]) || []);
    setActive((a) => a || (chs[0] ? { kind: "channel", id: chs[0].id, label: "# " + chs[0].name } : null));
    setLoading(false);
  }, []);
  useEffect(() => { boot(); }, [boot]);

  // chargement des messages + abonnement temps réel à la conversation active
  useEffect(() => {
    if (!supabase || !active) return;
    let cancelled = false;
    const col = active.kind === "channel" ? "channel_id" : "dm_id";
    (async () => {
      const res = await supabase!.from("chat_messages").select("*").eq(col, active.id).order("created_at").limit(500);
      if (!cancelled) setMsgs((res.data as ChatMsg[]) || []);
    })();
    const rt = supabase
      .channel("chat:" + active.kind + ":" + active.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `${col}=eq.${active.id}` },
        (payload) => {
          const m = payload.new as ChatMsg;
          setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old?.id) setMsgs((p) => p.filter((x) => x.id !== old.id));
        })
      .subscribe();
    return () => { cancelled = true; supabase!.removeChannel(rt); };
  }, [active]);

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, active]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !active || !text.trim()) return;
    setSending(true);
    const body = text.trim();
    const row: Record<string, string> = active.kind === "channel" ? { channel_id: active.id, body } : { dm_id: active.id, body };
    const { data, error } = await supabase.from("chat_messages").insert(row).select().single();
    setSending(false);
    if (error) { alert("Envoi impossible : " + error.message); return; }
    setText("");
    if (data) { const m = data as ChatMsg; setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])); }
  }

  async function delMsg(id: string) {
    if (!supabase || !confirm("Supprimer ce message ?")) return;
    await supabase.from("chat_messages").delete().eq("id", id);
    setMsgs((p) => p.filter((x) => x.id !== id));
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !chanName.trim()) return;
    const name = chanName.trim().replace(/^#+\s*/, "");
    const { data, error } = await supabase.from("chat_channels").insert({ name }).select().single();
    if (error) { alert("Création impossible : " + error.message); return; }
    const c = data as ChatChannel;
    setChannels((p) => [...p, c]);
    setChanName(""); setNewChan(false);
    setActive({ kind: "channel", id: c.id, label: "# " + c.name });
  }

  async function openDm(otherId: string, pseudo: string) {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("get_or_create_dm", { other: otherId });
    if (error) { alert("Impossible d'ouvrir la conversation : " + error.message); return; }
    const id = data as string;
    setDms((p) => (p.some((d) => d.id === id) ? p : [...p, { id, user_a: meId, user_b: otherId }]));
    setShowStart(false);
    setActive({ kind: "dm", id, label: pseudo, other: otherId });
  }

  if (err) return <div className="bu-empty">Messagerie non activée (table « chat_channels » absente). Lance le SQL fourni dans Supabase.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;

  const dmList = dms.map((d) => ({ id: d.id, other: d.user_a === meId ? d.user_b : d.user_a }));

  return (
    <div className="bu-msgr">
      <aside className="bu-msgr-side">
        <div className="bu-msgr-h"><span>Canaux</span>
          <button className="bu-msgr-add" onClick={() => setNewChan((v) => !v)} aria-label="Nouveau canal">＋</button>
        </div>
        {newChan && (
          <form className="bu-msgr-newc" onSubmit={createChannel}>
            <input placeholder="nom-du-canal" value={chanName} onChange={(e) => setChanName(e.target.value)} autoFocus />
            <button className="bu-btn bu-btn--sm" type="submit">OK</button>
          </form>
        )}
        <div className="bu-msgr-list">
          {channels.length === 0 ? <span className="bu-muted bu-msgr-none">Aucun canal.</span> :
            channels.map((c) => (
              <button key={c.id} className={"bu-msgr-item" + (active?.kind === "channel" && active.id === c.id ? " on" : "")}
                onClick={() => setActive({ kind: "channel", id: c.id, label: "# " + c.name })}># {c.name}</button>
            ))}
        </div>

        <div className="bu-msgr-h"><span>Messages directs</span>
          <button className="bu-msgr-add" onClick={() => setShowStart((v) => !v)} aria-label="Nouvelle conversation">＋</button>
        </div>
        {showStart && (
          <div className="bu-msgr-start">
            {members.length === 0 ? <span className="bu-muted bu-msgr-none">Aucun autre membre du bureau.</span> :
              members.map((m) => (
                <button key={m.id} className="bu-msgr-item ghost" onClick={() => openDm(m.id, m.pseudo)}>＋ {m.pseudo}</button>
              ))}
          </div>
        )}
        <div className="bu-msgr-list">
          {dmList.length === 0 ? <span className="bu-muted bu-msgr-none">Aucune conversation.</span> :
            dmList.map((d) => (
              <button key={d.id} className={"bu-msgr-item" + (active?.kind === "dm" && active.id === d.id ? " on" : "")}
                onClick={() => setActive({ kind: "dm", id: d.id, label: who[d.other] || "—", other: d.other })}>💬 {who[d.other] || "—"}</button>
            ))}
        </div>
      </aside>

      <section className="bu-msgr-main">
        <div className="bu-msgr-title">{active ? active.label : "Sélectionne une conversation"}</div>
        <div className="bu-msgr-scroll" ref={scrollRef}>
          {!active ? <p className="bu-muted">Choisis un canal ou un message direct à gauche.</p> :
            msgs.length === 0 ? <p className="bu-muted">Aucun message. Lance la discussion !</p> :
              msgs.map((m) => {
                const mine = m.sender === meId;
                return (
                  <div key={m.id} className={"bu-msg" + (mine ? " mine" : "")}>
                    {!mine && <div className="bu-msg-who">{who[m.sender] || "—"}</div>}
                    <div className="bu-msg-bubble">
                      <span>{m.body}</span>
                      {mine && <button className="bu-msg-del" onClick={() => delMsg(m.id)} aria-label="Supprimer">✕</button>}
                    </div>
                    <div className="bu-msg-time">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                );
              })}
        </div>
        <form className="bu-msgr-input" onSubmit={send}>
          <input placeholder={active ? "Écris un message…" : "Sélectionne une conversation"} value={text} onChange={(e) => setText(e.target.value)} disabled={!active} />
          <button className="bu-btn" type="submit" disabled={!active || sending || !text.trim()}>Envoyer</button>
        </form>
      </section>
    </div>
  );
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
  { key: "status", label: "Statut", type: "select", options: ["Payée", "En attente", "À renouveler", "Impayée"] },
  { key: "paid_date", label: "Payée le", type: "date" },
  { key: "due_date", label: "Échéance", type: "date" },
  { key: "method", label: "Moyen" },
];
const recetteFields: Field[] = [
  { key: "entry_date", label: "Date", type: "date" }, { key: "label", label: "Libellé" },
  { key: "category", label: "Catégorie" }, { key: "counterparty", label: "Origine" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "justificatif", label: "Justificatif (lien)" }, { key: "linked", label: "Lié à" },
  { key: "notes", label: "Commentaire", type: "textarea" },
];
const depenseFields: Field[] = [
  { key: "entry_date", label: "Date", type: "date" }, { key: "label", label: "Libellé" },
  { key: "category", label: "Catégorie" }, { key: "counterparty", label: "Fournisseur / bénéficiaire" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "justificatif", label: "Justificatif (lien)" }, { key: "linked", label: "Lié à" },
  { key: "notes", label: "Commentaire", type: "textarea" },
];
const invoiceFields: Field[] = [
  { key: "number", label: "N°" }, { key: "inv_date", label: "Date", type: "date" },
  { key: "party", label: "Émetteur / destinataire" }, { key: "amount", label: "Montant", type: "number" },
  { key: "status", label: "Statut", type: "select", options: ["À payer", "Payée", "En retard"] },
  { key: "due_date", label: "Échéance", type: "date" }, { key: "file", label: "Fichier (lien)" },
  { key: "notes", label: "Notes", type: "textarea" },
];
const budgetFields: Field[] = [
  { key: "category", label: "Catégorie" }, { key: "event", label: "Événement (optionnel)" },
  { key: "planned", label: "Prévu", type: "number" }, { key: "notes", label: "Notes", type: "textarea" },
];

function BudgetModule() {
  const [bl, setBl] = useState<Record<string, unknown>[]>([]);
  const [fin, setFin] = useState<{ kind: string; category: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      setLoading(true);
      const [b, f] = await Promise.all([
        supabase.from("budget_lines").select("*").order("category"),
        supabase.from("finance_entries").select("kind,category,amount"),
      ]);
      if (b.error) setErr(true); else { setErr(false); setBl((b.data as Record<string, unknown>[]) || []); }
      setFin((f.data as { kind: string; category: string; amount: number }[]) || []);
      setLoading(false);
    })();
  }, [tick]);
  if (err) return <div className="bu-empty">Module non activé (table « budget_lines » absente). Lance le SQL fourni.</div>;
  if (loading) return <p className="bu-muted">Chargement…</p>;
  const rec = fin.filter((x) => x.kind === "Recette").reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const dep = fin.filter((x) => x.kind === "Dépense").reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const depByCat = (c: string) => fin.filter((x) => x.kind === "Dépense" && x.category === c).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  return (
    <div>
      <div className="bu-kpis" style={{ marginBottom: "1rem" }}>
        <Kpi label="Recettes" value={eur(rec)} tone="pos" />
        <Kpi label="Dépenses" value={eur(dep)} tone="neg" />
        <Kpi label="Trésorerie" value={eur(rec - dep)} />
      </div>
      <div className="bu-toolbar"><strong>Prévisionnel vs réalisé</strong><button className="bu-btn bu-btn--ghost" onClick={() => setTick((t) => t + 1)}>↻ Actualiser</button></div>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Catégorie</th><th>Prévu</th><th>Réalisé (dépenses)</th><th>Écart</th></tr></thead>
        <tbody>
          {bl.length === 0 ? <tr><td colSpan={4} className="bu-muted">Aucune ligne de budget.</td></tr> :
            bl.map((l) => {
              const r = depByCat(l.category as string);
              const ec = (Number(l.planned) || 0) - r;
              return <tr key={String(l.id)}><td>{l.category as string}{l.event ? ` · ${l.event}` : ""}</td><td>{eur(l.planned as number)}</td><td>{eur(r)}</td><td style={{ color: ec < 0 ? "#e88a8a" : "#5bd08d" }}>{eur(ec)}</td></tr>;
            })}
        </tbody>
      </table></div>
      <p className="bu-muted" style={{ margin: ".9rem 0 .4rem" }}>Lignes de budget prévisionnel :</p>
      <Crud table="budget_lines" fields={budgetFields} orderBy="category" desc={false} />
    </div>
  );
}
const docFields = (cat: string): Field[] => [
  { key: "title", label: "Titre" }, { key: "link", label: "Lien" },
  { key: "doc_date", label: "Date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" },
  { key: "category", label: "Catégorie", type: "select", options: DOC_CATS },
];
// — Priorité 2 —
const eventFields: Field[] = [
  { key: "name", label: "Nom" }, { key: "event_date", label: "Date", type: "date" }, { key: "event_time", label: "Horaire" },
  { key: "place", label: "Lieu" }, { key: "type", label: "Type" }, { key: "responsible", label: "Responsable" },
  { key: "notes", label: "Notes", type: "textarea" },
];
const participantFields: Field[] = [
  { key: "event", label: "Événement" }, { key: "name", label: "Nom" },
  { key: "role", label: "Rôle", type: "select", options: ["Participant", "Bénévole", "Staff"] },
  { key: "present", label: "Présent", type: "bool" }, { key: "notes", label: "Infos", type: "textarea" },
];
const eventTaskFields: Field[] = [
  { key: "event", label: "Événement" }, { key: "task", label: "Tâche" },
  { key: "responsible", label: "Responsable" }, { key: "done", label: "Fait", type: "bool" },
  { key: "notes", label: "Notes", type: "textarea" },
];
const contractFields: Field[] = [
  { key: "partner", label: "Partenaire" }, { key: "start_date", label: "Début", type: "date" }, { key: "end_date", label: "Fin", type: "date" },
  { key: "amount", label: "Montant / valeur", type: "number" },
  { key: "status", label: "Statut", type: "select", options: ["En cours", "À renouveler", "Terminé"] },
  { key: "file", label: "Fichier (lien)" }, { key: "counterparts", label: "Contreparties", type: "textarea" }, { key: "notes", label: "Notes", type: "textarea" },
];
const followupFields: Field[] = [
  { key: "partner", label: "Partenaire" }, { key: "action", label: "Action / contrepartie" },
  { key: "due_date", label: "Échéance", type: "date" }, { key: "done", label: "Fait", type: "bool" }, { key: "notes", label: "Notes", type: "textarea" },
];
const equipmentFields: Field[] = [
  { key: "name", label: "Matériel" }, { key: "inv_number", label: "N° inventaire" }, { key: "category", label: "Catégorie" },
  { key: "quantity", label: "Qté", type: "number" },
  { key: "status", label: "État", type: "select", options: ["Disponible", "Prêté", "Maintenance", "Hors service"] },
  { key: "location", label: "Emplacement" }, { key: "responsible", label: "Responsable" },
  { key: "purchase_date", label: "Achat", type: "date" }, { key: "invoice", label: "Facture (lien)" }, { key: "notes", label: "Notes", type: "textarea" },
];
const loanFields: Field[] = [
  { key: "item", label: "Matériel" }, { key: "borrower", label: "Emprunteur" },
  { key: "out_date", label: "Sortie", type: "date" }, { key: "due_date", label: "Retour prévu", type: "date" },
  { key: "return_date", label: "Retour réel", type: "date" }, { key: "returned", label: "Rendu", type: "bool" },
  { key: "condition", label: "État au retour" }, { key: "notes", label: "Notes", type: "textarea" },
];
// — Priorité 3 : Équipes —
const playerFields: Field[] = [
  { key: "pseudo", label: "Pseudo" }, { key: "real_name", label: "Nom" }, { key: "team", label: "Équipe" },
  { key: "game", label: "Jeu" }, { key: "poste", label: "Poste" },
  { key: "status", label: "Statut", type: "select", options: ["Actif", "Remplaçant", "Essai", "Inactif"] },
  { key: "notes", label: "Infos internes", type: "textarea" },
];
const staffFields: Field[] = [
  { key: "name", label: "Nom" }, { key: "role", label: "Rôle" }, { key: "team", label: "Équipe" },
  { key: "notes", label: "Infos internes", type: "textarea" },
];
const competitionFields: Field[] = [
  { key: "name", label: "Compétition" }, { key: "team", label: "Équipe" }, { key: "game", label: "Jeu" },
  { key: "comp_date", label: "Date", type: "date" }, { key: "opponent", label: "Adversaire" },
  { key: "result", label: "Résultat" }, { key: "ranking", label: "Classement" }, { key: "notes", label: "Notes", type: "textarea" },
];

const BUREAU_ROLES = ["", "Président", "Trésorier", "Secrétaire", "Responsable esport", "Responsable événements", "Bénévole"];
const ROLE_MATRIX: [string, string][] = [
  ["Président", "Accès global à toutes les rubriques."],
  ["Trésorier", "Finance + Adhérents (cotisations)."],
  ["Secrétaire", "Administratif + Documents + Réunions."],
  ["Responsable esport", "Équipes + Joueurs + Compétitions."],
  ["Responsable événements", "Événements + Matériel."],
  ["Bénévole", "Tâches + événements autorisés."],
];

type Sub = { key: string; label: string; render: () => React.ReactNode };
type Section = { key: string; icon: string; label: string; subs: Sub[] };

const SECTIONS: Section[] = [
  { key: "dash", icon: "🏠", label: "Tableau de bord", subs: [{ key: "d", label: "Vue d'ensemble", render: () => <DashboardBureau /> }] },
  { key: "adherents", icon: "👥", label: "Adhérents", subs: [
    { key: "liste", label: "Liste des membres", render: () => <Crud table="members" fields={memberFields} orderBy="last_name" desc={false} /> },
    { key: "cotis", label: "Cotisations", render: () => <Crud table="dues" fields={duesFields} orderBy="due_date" /> },
    { key: "docs", label: "Documents", render: () => <Crud table="documents" fields={docFields("Administratif")} filter={(r) => r.category === "Administratif"} defaults={{ category: "Administratif" }} /> },
  ] },
  { key: "finance", icon: "💰", label: "Finance", subs: [
    { key: "recettes", label: "Recettes", render: () => <Crud table="finance_entries" fields={recetteFields} filter={(r) => r.kind === "Recette"} defaults={{ kind: "Recette" }} orderBy="entry_date" /> },
    { key: "depenses", label: "Dépenses", render: () => <Crud table="finance_entries" fields={depenseFields} filter={(r) => r.kind === "Dépense"} defaults={{ kind: "Dépense" }} orderBy="entry_date" /> },
    { key: "factures", label: "Factures", render: () => <Crud table="invoices" fields={invoiceFields} orderBy="inv_date" /> },
    { key: "budget", label: "Budget", render: () => <BudgetModule /> },
  ] },
  { key: "events", icon: "📅", label: "Événements", subs: [
    { key: "cal", label: "Calendrier", render: () => <Crud table="org_events" fields={eventFields} orderBy="event_date" /> },
    { key: "part", label: "Participants", render: () => <Crud table="event_participants" fields={participantFields} /> },
    { key: "orga", label: "Organisation", render: () => <Crud table="event_tasks" fields={eventTaskFields} /> },
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
    { key: "contrats", label: "Contrats", render: () => <Crud table="partner_contracts" fields={contractFields} orderBy="end_date" /> },
    { key: "suivi", label: "Suivi", render: () => <Crud table="partner_followups" fields={followupFields} orderBy="due_date" desc={false} /> },
  ] },
  { key: "teams", icon: "🎮", label: "Équipes", subs: [
    { key: "j", label: "Joueurs", render: () => <Crud table="bu_players" fields={playerFields} orderBy="pseudo" desc={false} /> },
    { key: "staff", label: "Staff", render: () => <Crud table="bu_staff" fields={staffFields} orderBy="name" desc={false} /> },
    { key: "compet", label: "Compétitions", render: () => <Crud table="bu_competitions" fields={competitionFields} orderBy="comp_date" /> },
  ] },
  { key: "material", icon: "📦", label: "Matériel", subs: [
    { key: "inv", label: "Inventaire", render: () => <Crud table="equipment" fields={equipmentFields} orderBy="name" desc={false} /> },
    { key: "prets", label: "Prêts", render: () => <Crud table="loans" fields={loanFields} orderBy="out_date" /> },
  ] },
  { key: "messagerie", icon: "💬", label: "Messagerie", subs: [
    { key: "chat", label: "Discussions", render: () => <MessengerModule /> },
  ] },
  { key: "admin", icon: "⚙️", label: "Administration", subs: [
    { key: "users", label: "Utilisateurs & accès", render: () => <UsersModule /> },
    { key: "roles", label: "Rôles / permissions", render: () => <RolesModule /> },
    { key: "journal", label: "Journal des actions", render: () => <JournalModule /> },
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
