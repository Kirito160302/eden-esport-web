"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";

const supabase = getSupabase();

const eur = (n: number) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fmtD = (d?: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "");

type Field = { key: string; label: string; type?: "text" | "number" | "date" | "select" | "bool" | "textarea" | "file"; options?: string[] };

/* ---- Stockage de fichiers (bucket privé « bureau ») ---- */
async function uploadFile(file: File, folder: string): Promise<{ path: string; name: string } | null> {
  if (!supabase) return null;
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("bureau").upload(path, file, { upsert: false });
  if (error) { alert("Envoi du fichier impossible : " + error.message); return null; }
  return { path, name: file.name };
}
async function openFile(pathOrUrl: string) {
  if (!supabase || !pathOrUrl) return;
  if (/^https?:\/\//i.test(pathOrUrl)) { window.open(pathOrUrl, "_blank", "noopener"); return; }
  const { data, error } = await supabase.storage.from("bureau").createSignedUrl(pathOrUrl, 120);
  if (error || !data) { alert("Fichier introuvable."); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}
function fileLabel(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return "lien";
  const base = pathOrUrl.split("/").pop() || pathOrUrl;
  return base.replace(/^[0-9a-f-]{36}-/i, "");
}

/* ---- Compteur de messages non lus (partagé menu + messagerie) ---- */
async function fetchUnreadMap(meId: string): Promise<Record<string, number>> {
  if (!supabase || !meId) return {};
  const [rd, ms] = await Promise.all([
    supabase.from("chat_reads").select("scope,ref_id,last_read_at").eq("user_id", meId),
    supabase.from("chat_messages").select("channel_id,dm_id,sender,created_at").order("created_at", { ascending: false }).limit(4000),
  ]);
  if (rd.error || ms.error) return {};
  const last: Record<string, number> = {};
  for (const r of (rd.data as { scope: string; ref_id: string; last_read_at: string }[]) || []) last[`${r.scope}:${r.ref_id}`] = new Date(r.last_read_at).getTime();
  const cnt: Record<string, number> = {};
  for (const m of (ms.data as { channel_id: string | null; dm_id: string | null; sender: string; created_at: string }[]) || []) {
    if (m.sender === meId) continue;
    const key = m.channel_id ? `channel:${m.channel_id}` : m.dm_id ? `dm:${m.dm_id}` : "";
    if (!key) continue;
    if (new Date(m.created_at).getTime() > (last[key] || 0)) cnt[key] = (cnt[key] || 0) + 1;
  }
  return cnt;
}

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
              ) : fl.type === "file" ? (
                <div className="bu-file">
                  <input type="text" placeholder="Lien ou fichier…" value={(f[fl.key] as string) ?? ""} onChange={(e) => setV(fl.key, e.target.value)} />
                  <label className="bu-btn bu-btn--ghost bu-btn--sm bu-filebtn" title="Joindre un fichier">📎
                    <input type="file" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const r = await uploadFile(file, table); if (r) setV(fl.key, r.path); e.target.value = ""; }} />
                  </label>
                  {f[fl.key] ? <button type="button" className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => openFile(f[fl.key] as string)}>Voir</button> : null}
                </div>
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
                    ) : fl.type === "file" ? (
                      r[fl.key] ? <button className="bu-edit" onClick={() => openFile(r[fl.key] as string)} title={fileLabel(r[fl.key] as string)}>📎 Voir</button> : "—"
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
   GRAPHIQUES (SVG maison, thème sombre)
   ================================================================ */
const C_REC = "#5bd08d", C_DEP = "#e88a8a";
const STATUS_COLORS: Record<string, string> = { "Payée": "#5bd08d", "En attente": "#f6c95c", "À renouveler": "#7d5cff", "Impayée": "#e26d6d" };

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="bu-chart">
      <div className="bu-chart-t">{title}</div>
      {empty ? <p className="bu-muted" style={{ padding: ".5rem 0" }}>Pas encore de données.</p> : children}
    </div>
  );
}

function MonthlyBars({ data }: { data: { label: string; rec: number; dep: number }[] }) {
  const W = 560, H = 210, padB = 26, padT = 10, padL = 6, padR = 6;
  const max = Math.max(1, ...data.flatMap((d) => [d.rec, d.dep]));
  const slot = (W - padL - padR) / data.length;
  const bw = Math.min(22, slot / 2 - 6);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bu-svg" role="img" aria-label="Recettes et dépenses par mois">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={padL} x2={W - padR} y1={y(max * g)} y2={y(max * g)} stroke="var(--line-2)" strokeWidth={1} />)}
      {data.map((d, i) => {
        const cx = padL + slot * i + slot / 2;
        return (
          <g key={d.label}>
            <rect x={cx - bw - 2} y={y(d.rec)} width={bw} height={H - padB - y(d.rec)} rx={3} fill={C_REC}><title>{d.label} · Recettes {eur(d.rec)}</title></rect>
            <rect x={cx + 2} y={y(d.dep)} width={bw} height={H - padB - y(d.dep)} rx={3} fill={C_DEP}><title>{d.label} · Dépenses {eur(d.dep)}</title></rect>
            <text x={cx} y={H - 8} textAnchor="middle" className="bu-svg-lab">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 60, cx = 80, cy = 80, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="bu-donut">
      <svg viewBox="0 0 160 160" width={150} height={150} role="img" aria-label="Répartition">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line-2)" strokeWidth={18} />
        {total > 0 && data.map((d) => {
          const frac = d.value / total;
          const seg = (
            <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={18}
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} transform={`rotate(-90 ${cx} ${cy})`}>
              <title>{d.label} : {d.value}</title>
            </circle>
          );
          acc += frac;
          return seg;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" className="bu-donut-n">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="bu-svg-lab">total</text>
      </svg>
      <div className="bu-legend">
        {data.map((d) => <div key={d.label} className="bu-leg"><span style={{ background: d.color }} />{d.label} <strong>{d.value}</strong></div>)}
      </div>
    </div>
  );
}

function HBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bu-hbars">
      {data.map((d) => (
        <div key={d.label} className="bu-hbar">
          <span className="bu-hbar-l" title={d.label}>{d.label}</span>
          <span className="bu-hbar-track"><span className="bu-hbar-fill" style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <span className="bu-hbar-v">{eur(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   TABLEAU DE BORD
   ================================================================ */
type FinRow = { kind: string; amount: number; category: string | null; entry_date: string | null };
function DashboardBureau() {
  const [k, setK] = useState<{ members: number; duesUp: number; solde: number; docs: number } | null>(null);
  const [months, setMonths] = useState<{ label: string; rec: number; dep: number }[]>([]);
  const [duesByStatus, setDuesByStatus] = useState<{ label: string; value: number; color: string }[]>([]);
  const [depByCat, setDepByCat] = useState<{ label: string; value: number }[]>([]);
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const [m, d, fe, doc] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("dues").select("status,paid"),
        supabase.from("finance_entries").select("kind,amount,category,entry_date"),
        supabase.from("documents").select("id", { count: "exact", head: true }),
      ]);
      const dues = (d.data as { status: string | null; paid: boolean }[]) || [];
      const fin = (fe.data as FinRow[]) || [];
      const rec = fin.filter((x) => x.kind === "Recette").reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const dep = fin.filter((x) => x.kind === "Dépense").reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const upStatuses = new Set(["Payée"]);
      const duesUp = dues.filter((x) => x.paid || (x.status && upStatuses.has(x.status))).length;
      setK({ members: m.count ?? 0, duesUp, solde: rec - dep, docs: doc.count ?? 0 });

      // 6 derniers mois
      const now = new Date();
      const buckets: { key: string; label: string; rec: number; dep: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ key: `${dt.getFullYear()}-${dt.getMonth()}`, label: dt.toLocaleDateString("fr-FR", { month: "short" }), rec: 0, dep: 0 });
      }
      const bmap = new Map(buckets.map((b) => [b.key, b]));
      for (const x of fin) {
        if (!x.entry_date) continue;
        const dt = new Date(x.entry_date);
        const b = bmap.get(`${dt.getFullYear()}-${dt.getMonth()}`);
        if (!b) continue;
        if (x.kind === "Recette") b.rec += Number(x.amount) || 0;
        else if (x.kind === "Dépense") b.dep += Number(x.amount) || 0;
      }
      setMonths(buckets.map((b) => ({ label: b.label, rec: b.rec, dep: b.dep })));

      // cotisations par statut
      const scount: Record<string, number> = {};
      for (const x of dues) { const s = x.status || (x.paid ? "Payée" : "En attente"); scount[s] = (scount[s] || 0) + 1; }
      setDuesByStatus(Object.keys(STATUS_COLORS).filter((s) => scount[s]).map((s) => ({ label: s, value: scount[s], color: STATUS_COLORS[s] }))
        .concat(Object.entries(scount).filter(([s]) => !STATUS_COLORS[s]).map(([s, v]) => ({ label: s, value: v, color: "#8a8aa0" }))));

      // top catégories de dépenses
      const ccount: Record<string, number> = {};
      for (const x of fin) { if (x.kind !== "Dépense") continue; const c = x.category || "Sans catégorie"; ccount[c] = (ccount[c] || 0) + (Number(x.amount) || 0); }
      setDepByCat(Object.entries(ccount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })));
    })();
  }, []);
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: "1rem" }}>Vue d&apos;ensemble de l&apos;association.</p>
      <div className="bu-kpis">
        <Kpi label="Adhérents" value={k ? String(k.members) : "…"} />
        <Kpi label="Cotisations à jour" value={k ? String(k.duesUp) : "…"} tone="pos" />
        <Kpi label="Solde" value={k ? eur(k.solde || 0) : "…"} tone={k && k.solde < 0 ? "neg" : "pos"} />
        <Kpi label="Documents" value={k ? String(k.docs) : "…"} />
      </div>
      <div className="bu-charts">
        <ChartCard title="Recettes & dépenses — 6 derniers mois" empty={months.every((m) => m.rec === 0 && m.dep === 0)}>
          <MonthlyBars data={months.length ? months : [{ label: "", rec: 0, dep: 0 }]} />
          <div className="bu-legend bu-legend--row">
            <div className="bu-leg"><span style={{ background: C_REC }} />Recettes</div>
            <div className="bu-leg"><span style={{ background: C_DEP }} />Dépenses</div>
          </div>
        </ChartCard>
        <ChartCard title="Cotisations par statut" empty={duesByStatus.length === 0}>
          <Donut data={duesByStatus} />
        </ChartCard>
        <ChartCard title="Top catégories de dépenses" empty={depByCat.length === 0}>
          <HBars data={depByCat} />
        </ChartCard>
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
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Rôles et rubriques accessibles. L&apos;attribution se fait dans Administration → Utilisateurs. Les restrictions sont appliquées dans le menu <strong>et côté serveur (RLS)</strong>. Un compte sans rôle ou « Président » a l&apos;accès complet.</p>
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
  const [q, setQ] = useState("");
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      setLoading(true);
      const [l, p] = await Promise.all([
        supabase.from("activity_log").select("*").order("at", { ascending: false }).limit(500),
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
  const view = q.trim()
    ? rows.filter((r) => [who[r.actor as string], r.action, r.entity, r.detail].some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase())))
    : rows;
  function exportCSV() {
    const cell = (v: unknown) => { const s = String(v ?? "").replace(/"/g, '""'); return /[";\n]/.test(s) ? `"${s}"` : s; };
    const lines = [["Date", "Utilisateur", "Action", "Module", "Détail"].join(";"), ...view.map((r) =>
      [new Date(r.at as string).toLocaleString("fr-FR"), who[r.actor as string] || "", r.action, r.entity, r.detail].map(cell).join(";"))];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "journal.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div>
      <p className="bu-muted" style={{ marginBottom: ".8rem" }}>Historique des actions (ajout, modification, suppression) enregistrées automatiquement. Journal non modifiable.</p>
      <div className="bu-toolbar">
        <input className="bu-search" placeholder="Rechercher (utilisateur, action, module…)" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="bu-btn bu-btn--ghost" onClick={exportCSV} disabled={view.length === 0}>Export CSV</button>
        <span className="bu-count">{view.length} / {rows.length}</span>
      </div>
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Module</th><th>Détail</th></tr></thead>
        <tbody>{view.length === 0 ? <tr><td colSpan={5} className="bu-muted">Aucune action enregistrée.</td></tr> :
          view.map((r) => (
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
type ChatMsg = { id: string; sender: string; body: string; created_at: string; channel_id?: string | null; dm_id?: string | null; attachment_path?: string | null; attachment_name?: string | null };
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
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Convo | null>(null);
  useEffect(() => { activeRef.current = active; }, [active]);

  const markRead = useCallback(async (c: Convo) => {
    const key = `${c.kind}:${c.id}`;
    setUnread((p) => (p[key] ? { ...p, [key]: 0 } : p));
    if (!supabase || !meId) return;
    try {
      await supabase.from("chat_reads").upsert({ user_id: meId, scope: c.kind, ref_id: c.id, last_read_at: new Date().toISOString() }, { onConflict: "user_id,scope,ref_id" });
      window.dispatchEvent(new Event("bu-unread"));
    } catch { /* table optionnelle */ }
  }, [meId]);

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
    setUnread(await fetchUnreadMap(uid));
    setActive((a) => a || (chs[0] ? { kind: "channel", id: chs[0].id, label: "# " + chs[0].name } : null));
    setLoading(false);
  }, []);
  useEffect(() => { boot(); }, [boot]);

  // suivi global des non-lus (conversations non ouvertes)
  useEffect(() => {
    if (!supabase || !meId) return;
    const rt = supabase.channel("chat-unread:" + meId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as ChatMsg;
        if (m.sender === meId) return;
        const key = m.channel_id ? `channel:${m.channel_id}` : m.dm_id ? `dm:${m.dm_id}` : "";
        if (!key) return;
        const a = activeRef.current;
        if (a && `${a.kind}:${a.id}` === key) return; // conversation ouverte → déjà lue
        setUnread((p) => ({ ...p, [key]: (p[key] || 0) + 1 }));
        window.dispatchEvent(new Event("bu-unread"));
      })
      .subscribe();
    return () => { supabase!.removeChannel(rt); };
  }, [meId]);

  // chargement des messages + abonnement temps réel à la conversation active
  useEffect(() => {
    if (!supabase || !active) return;
    let cancelled = false;
    const conv = active;
    const col = conv.kind === "channel" ? "channel_id" : "dm_id";
    (async () => {
      const res = await supabase!.from("chat_messages").select("*").eq(col, conv.id).order("created_at").limit(500);
      if (!cancelled) { setMsgs((res.data as ChatMsg[]) || []); markRead(conv); }
    })();
    const rt = supabase
      .channel("chat:" + conv.kind + ":" + conv.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `${col}=eq.${conv.id}` },
        (payload) => {
          const m = payload.new as ChatMsg;
          setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
          if (m.sender !== meId) markRead(conv);
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old?.id) setMsgs((p) => p.filter((x) => x.id !== old.id));
        })
      .subscribe();
    return () => { cancelled = true; supabase!.removeChannel(rt); };
  }, [active, markRead, meId]);

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, active]);

  async function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const r = await uploadFile(file, "chat");
    setUploading(false);
    if (r) setPending(r);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !active || (!text.trim() && !pending)) return;
    setSending(true);
    const row: Record<string, string | null> = active.kind === "channel" ? { channel_id: active.id } : { dm_id: active.id };
    row.body = text.trim();
    if (pending) { row.attachment_path = pending.path; row.attachment_name = pending.name; }
    const { data, error } = await supabase.from("chat_messages").insert(row).select().single();
    setSending(false);
    if (error) { alert("Envoi impossible : " + error.message); return; }
    setText(""); setPending(null);
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
            channels.map((c) => {
              const u = unread[`channel:${c.id}`] || 0;
              return (
                <button key={c.id} className={"bu-msgr-item" + (active?.kind === "channel" && active.id === c.id ? " on" : "")}
                  onClick={() => setActive({ kind: "channel", id: c.id, label: "# " + c.name })}>
                  <span className="bu-msgr-name"># {c.name}</span>
                  {u > 0 && <span className="bu-msgr-badge">{u}</span>}
                </button>
              );
            })}
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
            dmList.map((d) => {
              const u = unread[`dm:${d.id}`] || 0;
              return (
                <button key={d.id} className={"bu-msgr-item" + (active?.kind === "dm" && active.id === d.id ? " on" : "")}
                  onClick={() => setActive({ kind: "dm", id: d.id, label: who[d.other] || "—", other: d.other })}>
                  <span className="bu-msgr-name">💬 {who[d.other] || "—"}</span>
                  {u > 0 && <span className="bu-msgr-badge">{u}</span>}
                </button>
              );
            })}
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
                      {m.body ? <span>{m.body}</span> : null}
                      {m.attachment_path ? (
                        <button className="bu-msg-file" onClick={() => openFile(m.attachment_path as string)}>📎 {m.attachment_name || fileLabel(m.attachment_path)}</button>
                      ) : null}
                      {mine && <button className="bu-msg-del" onClick={() => delMsg(m.id)} aria-label="Supprimer">✕</button>}
                    </div>
                    <div className="bu-msg-time">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                );
              })}
        </div>
        <div className="bu-msgr-compose">
          {pending && (
            <div className="bu-msgr-pending">📎 {pending.name}<button type="button" onClick={() => setPending(null)} aria-label="Retirer">✕</button></div>
          )}
          {uploading && <div className="bu-msgr-pending bu-muted">Envoi du fichier…</div>}
          <form className="bu-msgr-input" onSubmit={send}>
            <label className="bu-msgr-clip" title="Joindre un fichier">📎
              <input type="file" hidden onChange={onAttach} disabled={!active || uploading} />
            </label>
            <input placeholder={active ? "Écris un message…" : "Sélectionne une conversation"} value={text} onChange={(e) => setText(e.target.value)} disabled={!active} />
            <button className="bu-btn" type="submit" disabled={!active || sending || uploading || (!text.trim() && !pending)}>Envoyer</button>
          </form>
        </div>
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
  { key: "join_date", label: "Date d'adhésion", type: "date" },
  { key: "season", label: "Saison" },
  { key: "member_role", label: "Rôle" },
  { key: "status", label: "Statut", type: "select", options: ["Actif", "Inactif"] },
  { key: "notes", label: "Infos internes", type: "textarea" },
];
const duesFields: Field[] = [
  { key: "member", label: "Membre" }, { key: "season", label: "Saison / année" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "status", label: "Statut", type: "select", options: ["Payée", "En attente", "À renouveler", "Non payée", "Impayée"] },
  { key: "paid_date", label: "Payée le", type: "date" },
  { key: "due_date", label: "Échéance", type: "date" },
  { key: "method", label: "Moyen" },
  { key: "justificatif", label: "Justificatif", type: "file" },
  { key: "notes", label: "Commentaire", type: "textarea" },
];
const recetteFields: Field[] = [
  { key: "entry_date", label: "Date", type: "date" }, { key: "label", label: "Libellé" },
  { key: "category", label: "Catégorie" }, { key: "counterparty", label: "Origine" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "justificatif", label: "Justificatif", type: "file" }, { key: "linked", label: "Lié à" },
  { key: "notes", label: "Commentaire", type: "textarea" },
];
const depenseFields: Field[] = [
  { key: "entry_date", label: "Date", type: "date" }, { key: "label", label: "Libellé" },
  { key: "category", label: "Catégorie" }, { key: "counterparty", label: "Fournisseur / bénéficiaire" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "justificatif", label: "Justificatif", type: "file" }, { key: "linked", label: "Lié à" },
  { key: "notes", label: "Commentaire", type: "textarea" },
];
const invoiceFields: Field[] = [
  { key: "number", label: "N°" }, { key: "inv_date", label: "Date", type: "date" },
  { key: "party", label: "Émetteur / destinataire" }, { key: "amount", label: "Montant", type: "number" },
  { key: "status", label: "Statut", type: "select", options: ["À payer", "Payée", "En retard"] },
  { key: "due_date", label: "Échéance", type: "date" }, { key: "file", label: "Fichier", type: "file" },
  { key: "notes", label: "Notes", type: "textarea" },
];
const budgetFields: Field[] = [
  { key: "exercice", label: "Exercice" },
  { key: "category", label: "Catégorie" }, { key: "event", label: "Événement (optionnel)" },
  { key: "planned", label: "Prévu", type: "number" }, { key: "notes", label: "Notes", type: "textarea" },
];
const subventionFields: Field[] = [
  { key: "organisme", label: "Organisme" }, { key: "dispositif", label: "Dispositif" },
  { key: "amount", label: "Montant", type: "number" },
  { key: "request_date", label: "Date de demande", type: "date" },
  { key: "due_date", label: "Échéance", type: "date" },
  { key: "status", label: "Statut", type: "select", options: ["En préparation", "Déposée", "Accordée", "Refusée", "Clôturée"] },
  { key: "file", label: "Justificatifs", type: "file" }, { key: "notes", label: "Commentaire", type: "textarea" },
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
  { key: "title", label: "Nom du document" },
  ...(cat === "Administratif" ? [{ key: "member", label: "Membre associé" } as Field] : []),
  ...(cat === "PV / réunion" ? [{ key: "doc_type", label: "Type" } as Field] : []),
  ...(cat === "Statuts" ? [{ key: "version", label: "Version" } as Field] : []),
  { key: "link", label: "Fichier / lien", type: "file" },
  { key: "doc_date", label: "Date", type: "date" }, { key: "notes", label: "Commentaire", type: "textarea" },
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
  { key: "responsible", label: "Responsable" }, { key: "due_date", label: "Échéance", type: "date" },
  { key: "material", label: "Matériel nécessaire" }, { key: "done", label: "Fait", type: "bool" },
  { key: "bilan", label: "Bilan", type: "textarea" }, { key: "notes", label: "Notes", type: "textarea" },
];
const contractFields: Field[] = [
  { key: "partner", label: "Partenaire" }, { key: "start_date", label: "Début", type: "date" }, { key: "end_date", label: "Fin", type: "date" },
  { key: "amount", label: "Montant / valeur", type: "number" },
  { key: "status", label: "Statut", type: "select", options: ["En cours", "À renouveler", "Terminé"] },
  { key: "file", label: "Fichier", type: "file" }, { key: "counterparts", label: "Contreparties", type: "textarea" }, { key: "notes", label: "Notes", type: "textarea" },
];
const followupFields: Field[] = [
  { key: "partner", label: "Partenaire" }, { key: "action", label: "Action / contrepartie" },
  { key: "responsible", label: "Responsable" },
  { key: "due_date", label: "Échéance", type: "date" }, { key: "done", label: "Fait", type: "bool" }, { key: "notes", label: "Commentaire", type: "textarea" },
];
const equipmentFields: Field[] = [
  { key: "name", label: "Matériel" }, { key: "inv_number", label: "N° inventaire" }, { key: "category", label: "Catégorie" },
  { key: "quantity", label: "Qté", type: "number" },
  { key: "status", label: "État", type: "select", options: ["Disponible", "Prêté", "Maintenance", "Hors service"] },
  { key: "location", label: "Emplacement" }, { key: "responsible", label: "Responsable" },
  { key: "purchase_date", label: "Achat", type: "date" }, { key: "invoice", label: "Facture", type: "file" }, { key: "notes", label: "Notes", type: "textarea" },
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
  { key: "comp_date", label: "Date", type: "date" }, { key: "comp_time", label: "Heure" }, { key: "opponent", label: "Adversaire" },
  { key: "result", label: "Résultat" }, { key: "ranking", label: "Classement" },
  { key: "file", label: "Lien / document", type: "file" }, { key: "notes", label: "Notes", type: "textarea" },
];

const BUREAU_ROLES = ["", "Président", "Trésorier", "Secrétaire", "Responsable esport", "Responsable événements", "Bénévole"];
const ROLE_MATRIX: [string, string][] = [
  ["Président", "Accès complet à toutes les rubriques (+ sans rôle = complet)."],
  ["Trésorier", "Tableau de bord · Adhérents · Finance · Messagerie."],
  ["Secrétaire", "Tableau de bord · Documents · Messagerie."],
  ["Responsable esport", "Tableau de bord · Équipes · Messagerie."],
  ["Responsable événements", "Tableau de bord · Événements · Matériel · Messagerie."],
  ["Bénévole", "Tableau de bord · Événements · Messagerie."],
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
    key: c, label: c, render: () => c === "Subvention"
      ? <Crud table="subventions" fields={subventionFields} orderBy="due_date" desc={false} />
      : <Crud table="documents" fields={docFields(c)} filter={(r) => r.category === c} defaults={{ category: c }} orderBy="doc_date" />,
  })) },
  { key: "partners", icon: "🤝", label: "Partenaires", subs: [
    { key: "contacts", label: "Contacts", render: () => <Crud table="partner_contacts" fields={[
      { key: "name", label: "Entreprise" }, { key: "contact_name", label: "Nom du contact" },
      { key: "role_contact", label: "Fonction" },
      { key: "email", label: "E-mail" }, { key: "phone", label: "Téléphone" },
      { key: "address", label: "Adresse" },
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
   CENTRE DE NOTIFICATIONS (cloche)
   ================================================================ */
type Alert = { key: string; icon: string; text: string; sec: string; sub: string; tone: "warn" | "bad" | "info" };
function NotificationsBell({ unreadChat, onNav }: { unreadChat: number; onNav: (s: string, sub: string) => void }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const t = new Date(); const iso = (d: Date) => d.toISOString().slice(0, 10);
      const todayS = iso(t), soonS = iso(new Date(t.getTime() + 7 * 864e5)), soon30 = iso(new Date(t.getTime() + 30 * 864e5));
      const [rd, rc, rf, rl, re] = await Promise.all([
        supabase.from("dues").select("status,due_date,paid"),
        supabase.from("partner_contracts").select("status,end_date"),
        supabase.from("partner_followups").select("done,due_date"),
        supabase.from("loans").select("returned,due_date"),
        supabase.from("org_events").select("event_date"),
      ]);
      const out: Alert[] = [];
      const dues = (rd.data as { status: string | null; due_date: string | null; paid: boolean }[]) || [];
      const nd = dues.filter((x) => (x.due_date && x.due_date < todayS && x.status !== "Payée" && !x.paid) || (x.status ? ["Impayée", "À renouveler", "En attente"].includes(x.status) : false)).length;
      if (nd) out.push({ key: "dues", icon: "💶", text: `${nd} cotisation${nd > 1 ? "s" : ""} à traiter`, sec: "adherents", sub: "cotis", tone: "warn" });
      const contracts = (rc.data as { status: string | null; end_date: string | null }[]) || [];
      const nc = contracts.filter((x) => x.status === "À renouveler" || (x.end_date ? x.end_date <= soon30 : false)).length;
      if (nc) out.push({ key: "contracts", icon: "🤝", text: `${nc} contrat${nc > 1 ? "s" : ""} à renouveler`, sec: "partners", sub: "contrats", tone: "warn" });
      const fu = (rf.data as { done: boolean; due_date: string | null }[]) || [];
      const nf = fu.filter((x) => !x.done && x.due_date && x.due_date <= soonS).length;
      if (nf) out.push({ key: "fu", icon: "📌", text: `${nf} suivi${nf > 1 ? "s" : ""} partenaire à faire`, sec: "partners", sub: "suivi", tone: "warn" });
      const loans = (rl.data as { returned: boolean; due_date: string | null }[]) || [];
      const nl = loans.filter((x) => !x.returned && x.due_date && x.due_date < todayS).length;
      if (nl) out.push({ key: "loans", icon: "📦", text: `${nl} retour${nl > 1 ? "s" : ""} de matériel en retard`, sec: "material", sub: "prets", tone: "bad" });
      const events = (re.data as { event_date: string | null }[]) || [];
      const ne = events.filter((x) => x.event_date && x.event_date >= todayS && x.event_date <= soonS).length;
      if (ne) out.push({ key: "events", icon: "📅", text: `${ne} événement${ne > 1 ? "s" : ""} dans les 7 jours`, sec: "events", sub: "cal", tone: "info" });
      setAlerts(out);
    })();
  }, []);
  const chatAlert = unreadChat > 0;
  const total = alerts.length + (chatAlert ? 1 : 0);
  return (
    <div className="bu-bell">
      <button className="bu-bell-btn" onClick={() => setOpen((v) => !v)} aria-label="Notifications">🔔{total > 0 && <span className="bu-bell-badge">{total}</span>}</button>
      {open && <div className="bu-bell-back" onClick={() => setOpen(false)} />}
      {open && (
        <div className="bu-bell-panel">
          <div className="bu-bell-h">Notifications</div>
          {total === 0 ? <div className="bu-bell-empty">Rien à signaler 🎉</div> : (
            <div className="bu-bell-list">
              {chatAlert && <button className="bu-bell-item t-info" onClick={() => { onNav("messagerie", "chat"); setOpen(false); }}><span>💬</span><span>{unreadChat} nouveau{unreadChat > 1 ? "x" : ""} message{unreadChat > 1 ? "s" : ""}</span></button>}
              {alerts.map((a) => <button key={a.key} className={"bu-bell-item t-" + a.tone} onClick={() => { onNav(a.sec, a.sub); setOpen(false); }}><span>{a.icon}</span><span>{a.text}</span></button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PERMISSIONS PAR RÔLE (menu + reflète la RLS serveur)
   ================================================================ */
const ROLE_ACCESS: Record<string, string[]> = {
  "Trésorier": ["dash", "adherents", "finance", "messagerie"],
  "Secrétaire": ["dash", "docs", "messagerie"],
  "Responsable esport": ["dash", "teams", "messagerie"],
  "Responsable événements": ["dash", "events", "material", "messagerie"],
  "Bénévole": ["dash", "events", "messagerie"],
};
function sectionsForRole(role?: string | null): string[] {
  if (!role || role === "Président") return SECTIONS.map((s) => s.key); // accès complet
  return ROLE_ACCESS[role] || SECTIONS.map((s) => s.key); // rôle inconnu → complet (sécurité anti-blocage)
}

/* ================================================================
   APPLI BUREAU (shell)
   ================================================================ */
function BureauApp({ pseudo, meId, role, onLogout }: { pseudo: string; meId: string; role?: string | null; onLogout: () => void }) {
  const allowedKeys = sectionsForRole(role);
  const visibleSections = SECTIONS.filter((s) => allowedKeys.includes(s.key));
  const [sec, setSec] = useState(visibleSections[0]?.key || "dash");
  const [sub, setSub] = useState(visibleSections[0]?.subs[0]?.key || "d");
  const [navOpen, setNavOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const section = visibleSections.find((s) => s.key === sec) || visibleSections[0] || SECTIONS[0];
  const current = section.subs.find((x) => x.key === sub) || section.subs[0];

  // total de messages non lus pour la pastille du menu
  useEffect(() => {
    if (!supabase || !meId) return;
    let live = true;
    const refresh = async () => { const m = await fetchUnreadMap(meId); if (live) setUnreadTotal(Object.values(m).reduce((s, n) => s + n, 0)); };
    refresh();
    const onEvt = () => refresh();
    window.addEventListener("bu-unread", onEvt);
    const rt = supabase.channel("bu-unread-nav:" + meId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => refresh())
      .subscribe();
    return () => { live = false; window.removeEventListener("bu-unread", onEvt); supabase!.removeChannel(rt); };
  }, [meId]);

  const go = (sKey: string, subKey: string) => { setSec(sKey); setSub(subKey); setNavOpen(false); };

  return (
    <div className="bu-shell">
      <button className="bu-burger" onClick={() => setNavOpen((v) => !v)}>☰ Menu</button>
      <aside className={"bu-side" + (navOpen ? " open" : "")}>
        <div className="bu-brand">Bureau · Eden</div>
        <nav>
          {visibleSections.map((s) => (
            <div key={s.key} className="bu-navgroup">
              <button className={"bu-navsec" + (s.key === sec ? " on" : "")} onClick={() => go(s.key, s.subs[0].key)}>
                <span>{s.icon}</span> {s.label}
                {s.key === "messagerie" && unreadTotal > 0 && <span className="bu-navbadge">{unreadTotal}</span>}
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
          <NotificationsBell unreadChat={unreadTotal} onNav={go} />
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
  const [profile, setProfile] = useState<{ id: string; pseudo: string; is_bureau?: boolean; bureau_role?: string | null } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setProfile(null); setReady(true); return; }
    let r = await supabase.from("profiles").select("id,pseudo,is_bureau,bureau_role").eq("id", session.user.id).maybeSingle();
    if (r.error) r = await supabase.from("profiles").select("id,pseudo,is_bureau").eq("id", session.user.id).maybeSingle();
    if (r.error) r = await supabase.from("profiles").select("id,pseudo").eq("id", session.user.id).maybeSingle();
    setProfile((r.data as { id: string; pseudo: string; is_bureau?: boolean; bureau_role?: string | null }) || null);
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
  return <BureauApp pseudo={profile.pseudo} meId={profile.id} role={profile.bureau_role} onLogout={logout} />;
}
