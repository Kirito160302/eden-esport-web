"use client";
/* ================================================================
   CLASH ROYALE solo 1v1 — format "suisse → poules → arbre"
   Phase 1 Ronde suisse (5 rondes BO1, appariement par bilan, Buchholz)
   → Phase 2 Poules éliminatoires (4 poules de 4 en serpentin, BO3,
   chacun contre chacun) → Phase 3 Arbre final à 8 (quarts/demies BO3,
   finale BO5, petite finale BO3). Tout stocké dans tournament_matches :
   bracket "S" = suisse · "P0..P3" = poules A..D · "K" = arbre ·
   "B" = petite finale. Score = "g1-g2/c1-c2" (manches / couronnes),
   ou "bye".
   ================================================================ */
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Tournament, TParticipant, TMatch } from "./Tournois";

const supabase = getSupabase();

export type CRConfig = {
  swiss_rounds: number;
  seeds: number; // qualifiés en poules (16)
  bo: { poule: number; quarts: number; demies: number; petite: number; finale: number };
};
export const CR_DEFAULT: CRConfig = {
  swiss_rounds: 5, seeds: 16,
  bo: { poule: 3, quarts: 3, demies: 3, petite: 3, finale: 5 },
};
const getCfg = (t: Tournament): CRConfig => {
  const c = (t as unknown as { config?: Partial<CRConfig> }).config || {};
  return { ...CR_DEFAULT, ...c, bo: { ...CR_DEFAULT.bo, ...(c.bo || {}) } };
};
const clinch = (bo: number) => Math.floor(bo / 2) + 1;

/* ---------------- Score ---------------- */
type Sc = { g1: number; g2: number; c1: number; c2: number; bye?: boolean };
function parseSc(s: string | null): Sc | null {
  if (!s) return null;
  if (s === "bye") return { g1: 1, g2: 0, c1: 0, c2: 0, bye: true };
  const m = s.match(/^(\d+)-(\d+)\/(\d+)-(\d+)$/);
  if (!m) return null;
  return { g1: +m[1], g2: +m[2], c1: +m[3], c2: +m[4] };
}
const fmtSc = (g1: number, g2: number, c1: number, c2: number) => `${g1}-${g2}/${c1}-${c2}`;

/* ---------------- Phase courante ---------------- */
export function crPhase(matches: TMatch[]): "start" | "suisse" | "poules" | "arbre" {
  const hasK = matches.some((m) => m.bracket === "K" || m.bracket === "B");
  const hasP = matches.some((m) => (m.bracket || "").startsWith("P"));
  const hasS = matches.some((m) => m.bracket === "S");
  return hasK ? "arbre" : hasP ? "poules" : hasS ? "suisse" : "start";
}
const PHASES: { key: string; label: string }[] = [
  { key: "suisse", label: "Ronde suisse" },
  { key: "poules", label: "Poules" },
  { key: "arbre", label: "Arbre final" },
];

/* ---------------- Suisse : classement ---------------- */
const pkey = (a: string, b: string) => [a, b].sort().join("|");
type SRow = { id: string; v: number; buch: number; cd: number; seed: number; bye: boolean };
function swissStandings(parts: TParticipant[], sm: TMatch[]): SRow[] {
  const wins: Record<string, number> = {}, opps: Record<string, string[]> = {}, cd: Record<string, number> = {}, bye: Record<string, boolean> = {};
  const seed: Record<string, number> = {};
  for (const p of parts) { wins[p.id] = 0; opps[p.id] = []; cd[p.id] = 0; bye[p.id] = false; seed[p.id] = p.seed; }
  for (const m of sm) {
    const sc = parseSc(m.score);
    if (sc?.bye && m.p1_id) { wins[m.p1_id] = (wins[m.p1_id] || 0) + 1; bye[m.p1_id] = true; continue; }
    if (!m.winner_id || !m.p1_id || !m.p2_id || !sc) continue;
    wins[m.winner_id] = (wins[m.winner_id] || 0) + 1;
    opps[m.p1_id].push(m.p2_id); opps[m.p2_id].push(m.p1_id);
    cd[m.p1_id] += sc.c1 - sc.c2; cd[m.p2_id] += sc.c2 - sc.c1;
  }
  const buch: Record<string, number> = {};
  for (const p of parts) buch[p.id] = (opps[p.id] || []).reduce((s, o) => s + (wins[o] || 0), 0);
  return parts.map((p) => ({ id: p.id, v: wins[p.id] || 0, buch: buch[p.id] || 0, cd: cd[p.id] || 0, seed: seed[p.id], bye: bye[p.id] }))
    .sort((a, b) => b.v - a.v || b.buch - a.buch || b.cd - a.cd || a.seed - b.seed);
}

/* ---------------- Suisse : appariement ---------------- */
function swissRound1(seedOrder: string[]): { pairs: [string, string][]; bye: string | null } {
  let pool = [...seedOrder]; let bye: string | null = null;
  if (pool.length % 2 === 1) { bye = pool[pool.length - 1]; pool = pool.slice(0, -1); }
  const h = pool.length / 2, top = pool.slice(0, h), bot = pool.slice(h);
  return { pairs: top.map((a, i) => [a, bot[i]] as [string, string]), bye };
}
function pairBacktrack(order: string[], played: Set<string>): [string, string][] | null {
  if (order.length === 0) return [];
  const a = order[0];
  for (let i = 1; i < order.length; i++) {
    const b = order[i];
    if (played.has(pkey(a, b))) continue;
    const rest = order.filter((_, j) => j !== 0 && j !== i);
    const sub = pairBacktrack(rest, played);
    if (sub) return [[a, b], ...sub];
  }
  return null;
}
function swissNext(order: string[], played: Set<string>, hadBye: Set<string>): { pairs: [string, string][]; bye: string | null } {
  let pool = [...order]; let bye: string | null = null;
  if (pool.length % 2 === 1) {
    for (let i = pool.length - 1; i >= 0; i--) if (!hadBye.has(pool[i])) { bye = pool[i]; break; }
    if (bye == null) bye = pool[pool.length - 1];
    pool = pool.filter((x) => x !== bye);
  }
  let pairs = pairBacktrack(pool, played);
  if (!pairs) { pairs = []; for (let i = 0; i < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]); }
  return { pairs, bye };
}

/* ---------------- Poules : serpentin + tours ---------------- */
function serpentine(ids: string[], nGroups: number): string[][] {
  const g: string[][] = Array.from({ length: nGroups }, () => []);
  let dir = 1, col = 0;
  for (const id of ids) { g[col].push(id); col += dir; if (col === nGroups) { col = nGroups - 1; dir = -1; } else if (col === -1) { col = 0; dir = 1; } }
  return g;
}
const POULE_TOURS: [number, number][][] = [[[0, 3], [1, 2]], [[0, 2], [1, 3]], [[0, 1], [2, 3]]];

type PRow = { id: string; v: number; md: number; cd: number; srank: number };
function pouleStandings(members: { id: string; srank: number }[], pm: TMatch[]): PRow[] {
  const st: Record<string, PRow> = {};
  for (const m of members) st[m.id] = { id: m.id, v: 0, md: 0, cd: 0, srank: m.srank };
  for (const m of pm) {
    const sc = parseSc(m.score);
    if (!m.winner_id || !m.p1_id || !m.p2_id || !sc) continue;
    st[m.winner_id].v += 1;
    if (st[m.p1_id]) { st[m.p1_id].md += sc.g1 - sc.g2; st[m.p1_id].cd += sc.c1 - sc.c2; }
    if (st[m.p2_id]) { st[m.p2_id].md += sc.g2 - sc.g1; st[m.p2_id].cd += sc.c2 - sc.c1; }
  }
  const h2h = (a: string, b: string) => {
    const m = pm.find((x) => x.winner_id && ((x.p1_id === a && x.p2_id === b) || (x.p1_id === b && x.p2_id === a)));
    if (!m) return 0; return m.winner_id === a ? -1 : 1;
  };
  return members.map((m) => m.id)
    .sort((a, b) => st[b].v - st[a].v || h2h(a, b) || st[b].md - st[a].md || st[b].cd - st[a].cd || st[a].srank - st[b].srank)
    .map((id) => st[id]);
}

/* ================================================================
   Petits composants de rendu partagés
   ================================================================ */
function ResultForm({ bo, p1, p2, init, onSave, onCancel }: {
  bo: number; p1: string; p2: string; init: Sc | null;
  onSave: (g1: number, g2: number, c1: number, c2: number) => void; onCancel: () => void;
}) {
  const [g1, setG1] = useState(init ? String(init.g1) : "");
  const [g2, setG2] = useState(init ? String(init.g2) : "");
  const [c1, setC1] = useState(init ? String(init.c1) : "");
  const [c2, setC2] = useState(init ? String(init.c2) : "");
  const need = clinch(bo);
  function save() {
    if (bo === 1) {
      const a = parseInt(c1), b = parseInt(c2);
      if (isNaN(a) || isNaN(b) || a === b) { alert("Entre les couronnes (différentes) des 2 joueurs."); return; }
      onSave(a > b ? 1 : 0, a > b ? 0 : 1, a, b);
    } else {
      const a = parseInt(g1), b = parseInt(g2);
      if (isNaN(a) || isNaN(b) || Math.max(a, b) !== need || Math.min(a, b) >= need) { alert(`En BO${bo}, le vainqueur gagne ${need} manches (ex : ${need}-${Math.max(0, need - 1)}).`); return; }
      onSave(a, b, parseInt(c1) || 0, parseInt(c2) || 0);
    }
  }
  return (
    <div className="cr-form">
      {bo === 1 ? (
        <div className="cr-form-ln"><span className="cr-form-lb">Couronnes</span>
          <input className="cr-in" inputMode="numeric" value={c1} onChange={(e) => setC1(e.target.value)} placeholder={p1.slice(0, 6)} />
          <span>–</span>
          <input className="cr-in" inputMode="numeric" value={c2} onChange={(e) => setC2(e.target.value)} placeholder={p2.slice(0, 6)} />
        </div>
      ) : (
        <>
          <div className="cr-form-ln"><span className="cr-form-lb">Manches</span>
            <input className="cr-in" inputMode="numeric" value={g1} onChange={(e) => setG1(e.target.value)} placeholder="0" />
            <span>–</span>
            <input className="cr-in" inputMode="numeric" value={g2} onChange={(e) => setG2(e.target.value)} placeholder="0" />
          </div>
          <div className="cr-form-ln"><span className="cr-form-lb">Couronnes</span>
            <input className="cr-in" inputMode="numeric" value={c1} onChange={(e) => setC1(e.target.value)} placeholder="opt." />
            <span>–</span>
            <input className="cr-in" inputMode="numeric" value={c2} onChange={(e) => setC2(e.target.value)} placeholder="opt." />
          </div>
        </>
      )}
      <div className="cr-form-act"><button className="bu-btn bu-btn--sm" onClick={save}>Valider</button><button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={onCancel}>Annuler</button></div>
    </div>
  );
}

function Duel({ m, bo, nameOf, editable, onResult }: {
  m: TMatch; bo: number; nameOf: (id: string | null) => string; editable: boolean;
  onResult?: (m: TMatch, g1: number, g2: number, c1: number, c2: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const sc = parseSc(m.score);
  const ready = !!m.p1_id && !!m.p2_id;
  return (
    <div className={"cr-duel" + (m.winner_id ? " done" : "")}>
      <div className={"cr-side" + (m.winner_id && m.winner_id === m.p1_id ? " win" : "")}>
        <span className="cr-nm">{nameOf(m.p1_id) || <em>à venir</em>}</span>
        {sc && !sc.bye && <span className="cr-g">{sc.g1}</span>}
      </div>
      <div className={"cr-side" + (m.winner_id && m.winner_id === m.p2_id ? " win" : "")}>
        <span className="cr-nm">{m.score === "bye" ? <em>exempt</em> : nameOf(m.p2_id) || <em>à venir</em>}</span>
        {sc && !sc.bye && <span className="cr-g">{sc.g2}</span>}
      </div>
      {editable && ready && m.score !== "bye" && (
        open
          ? <ResultForm bo={bo} p1={nameOf(m.p1_id)} p2={nameOf(m.p2_id)} init={sc && !sc.bye ? sc : null}
              onSave={(g1, g2, c1, c2) => { onResult?.(m, g1, g2, c1, c2); setOpen(false); }} onCancel={() => setOpen(false)} />
          : <button className="brk-score-btn" onClick={() => setOpen(true)}>{m.winner_id ? "modifier" : "saisir"}</button>
      )}
    </div>
  );
}

function SwissTable({ rows, nameOf, qual }: { rows: SRow[]; nameOf: (id: string) => string; qual: number }) {
  return (
    <table className="brk-rank">
      <thead><tr><th>#</th><th>Joueur</th><th>V</th><th>Buch.</th><th>±Cour.</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={r.id} className={i < qual ? "qual" : ""}>
          <td>{i + 1}</td><td className="nm">{nameOf(r.id)}{r.bye ? " ·exempt" : ""}</td><td><b>{r.v}</b></td><td>{r.buch}</td><td>{r.cd > 0 ? "+" + r.cd : r.cd}</td>
        </tr>))}
      </tbody>
    </table>
  );
}
function PouleTable({ rows, nameOf }: { rows: PRow[]; nameOf: (id: string) => string }) {
  return (
    <table className="brk-rank">
      <thead><tr><th>#</th><th>Joueur</th><th>V</th><th>±Man.</th><th>±Cour.</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={r.id} className={i < 2 ? "qual" : ""}>
          <td>{i + 1}</td><td className="nm">{nameOf(r.id)}</td><td><b>{r.v}</b></td><td>{r.md > 0 ? "+" + r.md : r.md}</td><td>{r.cd > 0 ? "+" + r.cd : r.cd}</td>
        </tr>))}
      </tbody>
    </table>
  );
}

/* Rendu de l'arbre final (quarts/demies/finale + petite finale) */
function ArbreView({ matches, cfg, nameOf, editable, onResult }: {
  matches: TMatch[]; cfg: CRConfig; nameOf: (id: string | null) => string; editable: boolean;
  onResult?: (m: TMatch, g1: number, g2: number, c1: number, c2: number) => void;
}) {
  const K = matches.filter((m) => m.bracket === "K");
  const B = matches.filter((m) => m.bracket === "B");
  const qf = K.filter((m) => m.round === 1).sort((a, b) => a.slot - b.slot);
  const df = K.filter((m) => m.round === 2).sort((a, b) => a.slot - b.slot);
  const fin = K.filter((m) => m.round === 3);
  const boOf = (r: number) => (r === 1 ? cfg.bo.quarts : r === 2 ? cfg.bo.demies : cfg.bo.finale);
  return (
    <div className="cr-arbre">
      <div className="cr-col"><div className="cr-col-h">Quarts · BO{cfg.bo.quarts}</div>{qf.map((m) => <Duel key={m.id} m={m} bo={boOf(1)} nameOf={nameOf} editable={editable} onResult={onResult} />)}</div>
      <div className="cr-col"><div className="cr-col-h">Demies · BO{cfg.bo.demies}</div>{df.map((m) => <Duel key={m.id} m={m} bo={boOf(2)} nameOf={nameOf} editable={editable} onResult={onResult} />)}</div>
      <div className="cr-col">
        <div className="cr-col-h">Finale · BO{cfg.bo.finale}</div>{fin.map((m) => <Duel key={m.id} m={m} bo={boOf(3)} nameOf={nameOf} editable={editable} onResult={onResult} />)}
        {B.length > 0 && <><div className="cr-col-h cr-petite">Petite finale · BO{cfg.bo.petite}</div>{B.map((m) => <Duel key={m.id} m={m} bo={cfg.bo.petite} nameOf={nameOf} editable={editable} onResult={onResult} />)}</>}
      </div>
    </div>
  );
}

const pouleLetter = (g: number) => String.fromCharCode(65 + g);
const arbreChampion = (matches: TMatch[]) => matches.find((m) => m.bracket === "K" && m.round === 3)?.winner_id || null;

/* ================================================================
   BUREAU — gestion
   ================================================================ */
export function ClashRoyaleAdmin({ t, parts, matches, reload }: {
  t: Tournament; parts: TParticipant[]; matches: TMatch[]; reload: () => void;
}) {
  const cfg = getCfg(t);
  const nameOf = (id: string | null) => (id ? parts.find((p) => p.id === id)?.name || "—" : "");
  const nameReq = (id: string) => parts.find((p) => p.id === id)?.name || "—";
  const phase = crPhase(matches);

  async function saveCfg(patch: Partial<CRConfig>) { if (!supabase) return; await supabase.from("tournaments").update({ config: { ...cfg, ...patch } }).eq("id", t.id); reload(); }
  async function saveBo(patch: Partial<CRConfig["bo"]>) { await saveCfg({ bo: { ...cfg.bo, ...patch } }); }

  // --- SUISSE ---
  const sm = matches.filter((m) => m.bracket === "S");
  const sRounds = sm.length ? Math.max(...sm.map((m) => m.round)) : 0;
  const lastRound = sm.filter((m) => m.round === sRounds);
  const lastDone = sRounds > 0 && lastRound.every((m) => m.winner_id || m.score === "bye");
  const sStand = swissStandings(parts, sm);

  async function genSwissRound() {
    if (!supabase) return;
    if (parts.length < 2) { alert("Au moins 2 joueurs."); return; }
    const next = sRounds + 1;
    let pairs: [string, string][]; let bye: string | null;
    if (next === 1) {
      ({ pairs, bye } = swissRound1([...parts].sort((a, b) => a.seed - b.seed).map((p) => p.id)));
    } else {
      const played = new Set<string>(); const hadBye = new Set<string>();
      for (const m of sm) { if (m.score === "bye" && m.p1_id) hadBye.add(m.p1_id); else if (m.p1_id && m.p2_id) played.add(pkey(m.p1_id, m.p2_id)); }
      ({ pairs, bye } = swissNext(sStand.map((r) => r.id), played, hadBye));
    }
    const rows: Omit<TMatch, "id">[] = pairs.map(([p1, p2], s) => ({
      tournament_id: t.id, bracket: "S", round: next, slot: s, p1_id: p1, p2_id: p2,
      winner_id: null, score: null, status: "pending", win_to: null, lose_to: null,
    }));
    if (bye) rows.push({ tournament_id: t.id, bracket: "S", round: next, slot: pairs.length, p1_id: bye, p2_id: null, winner_id: bye, score: "bye", status: "done", win_to: null, lose_to: null });
    await supabase.from("tournament_matches").insert(rows);
    await supabase.from("tournaments").update({ status: "running" }).eq("id", t.id);
    reload();
  }

  // Clôture suisse → poules
  async function toPoules() {
    if (!supabase) return;
    const top = sStand.slice(0, cfg.seeds).map((r) => r.id);
    if (top.length < cfg.seeds) { alert(`Il faut au moins ${cfg.seeds} joueurs classés pour former les poules.`); return; }
    const poules = serpentine(top, 4); // A..D
    for (let g = 0; g < 4; g++) for (const id of poules[g]) await supabase.from("tournament_participants").update({ group_no: g }).eq("id", id);
    for (const p of parts) if (!top.includes(p.id)) await supabase.from("tournament_participants").update({ group_no: null }).eq("id", p.id);
    const srank: Record<string, number> = {}; top.forEach((id, i) => (srank[id] = i + 1));
    const rows: Omit<TMatch, "id">[] = [];
    for (let g = 0; g < 4; g++) {
      const mem = poules[g]; // déjà dans l'ordre des seeds (serpentin)
      POULE_TOURS.forEach((tour, ti) => tour.forEach(([x, y], s) => rows.push({
        tournament_id: t.id, bracket: "P" + g, round: ti + 1, slot: s, p1_id: mem[x], p2_id: mem[y],
        winner_id: null, score: null, status: "pending", win_to: null, lose_to: null,
      })));
    }
    await supabase.from("tournament_matches").insert(rows);
    reload();
  }

  // --- POULES ---
  const pMatchesDone = phase === "poules" && matches.filter((m) => (m.bracket || "").startsWith("P")).length > 0
    && matches.filter((m) => (m.bracket || "").startsWith("P")).every((m) => m.winner_id);
  const srankOf = (() => { const r: Record<string, number> = {}; sStand.forEach((row, i) => (r[row.id] = i + 1)); return r; })();
  const pouleMembers = (g: number) => parts.filter((p) => p.group_no === g).map((p) => ({ id: p.id, srank: srankOf[p.id] ?? 999 }))
    .sort((a, b) => a.srank - b.srank);

  // Clôture poules → arbre
  async function toArbre() {
    if (!supabase) return;
    const fin: Record<string, string[]> = {};
    for (let g = 0; g < 4; g++) {
      const pm = matches.filter((m) => m.bracket === "P" + g);
      const st = pouleStandings(pouleMembers(g), pm);
      if (!st[0] || !st[1]) { alert("Chaque poule doit avoir ses matchs terminés."); return; }
      fin[pouleLetter(g)] = [st[0].id, st[1].id];
    }
    const A = fin.A, B = fin.B, C = fin.C, D = fin.D;
    // QF: 1A v2B · 1D v2C · 1B v2A · 1C v2D ; DF1=QF1vQF2, DF2=QF3vQF4
    const rows: Omit<TMatch, "id">[] = [
      { tournament_id: t.id, bracket: "K", round: 1, slot: 0, p1_id: A[0], p2_id: B[1], winner_id: null, score: null, status: "pending", win_to: "K:2:0:1", lose_to: null },
      { tournament_id: t.id, bracket: "K", round: 1, slot: 1, p1_id: D[0], p2_id: C[1], winner_id: null, score: null, status: "pending", win_to: "K:2:0:2", lose_to: null },
      { tournament_id: t.id, bracket: "K", round: 1, slot: 2, p1_id: B[0], p2_id: A[1], winner_id: null, score: null, status: "pending", win_to: "K:2:1:1", lose_to: null },
      { tournament_id: t.id, bracket: "K", round: 1, slot: 3, p1_id: C[0], p2_id: D[1], winner_id: null, score: null, status: "pending", win_to: "K:2:1:2", lose_to: null },
      { tournament_id: t.id, bracket: "K", round: 2, slot: 0, p1_id: null, p2_id: null, winner_id: null, score: null, status: "pending", win_to: "K:3:0:1", lose_to: "B:3:0:1" },
      { tournament_id: t.id, bracket: "K", round: 2, slot: 1, p1_id: null, p2_id: null, winner_id: null, score: null, status: "pending", win_to: "K:3:0:2", lose_to: "B:3:0:2" },
      { tournament_id: t.id, bracket: "K", round: 3, slot: 0, p1_id: null, p2_id: null, winner_id: null, score: null, status: "pending", win_to: null, lose_to: null },
      { tournament_id: t.id, bracket: "B", round: 3, slot: 0, p1_id: null, p2_id: null, winner_id: null, score: null, status: "pending", win_to: null, lose_to: null },
    ];
    await supabase.from("tournament_matches").insert(rows);
    reload();
  }

  // --- Saisie d'un résultat ---
  async function onResult(m: TMatch, g1: number, g2: number, c1: number, c2: number) {
    if (!supabase) return;
    const winnerId = g1 > g2 ? m.p1_id : m.p2_id;
    const loserId = g1 > g2 ? m.p2_id : m.p1_id;
    await supabase.from("tournament_matches").update({ winner_id: winnerId, score: fmtSc(g1, g2, c1, c2), status: "done" }).eq("id", m.id);
    // propagation dans l'arbre (win_to / lose_to)
    const push = async (ref: string | null, who: string | null) => {
      if (!ref || !who) return;
      const [b, r, s, side] = ref.split(":");
      const tgt = matches.find((x) => x.bracket === b && x.round === +r && x.slot === +s);
      if (tgt) await supabase!.from("tournament_matches").update({ [+side === 1 ? "p1_id" : "p2_id"]: who }).eq("id", tgt.id);
    };
    await push(m.win_to, winnerId); await push(m.lose_to, loserId);
    if (m.bracket === "K" && m.round === 3) await supabase.from("tournaments").update({ status: "done" }).eq("id", t.id);
    reload();
  }

  const champ = arbreChampion(matches);

  return (
    <div>
      {/* Réglages */}
      <div className="bu-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Réglages — Clash Royale 1v1</h3>
        <div className="br-cfg">
          <label>Rondes suisses<input type="number" min={1} max={9} value={cfg.swiss_rounds} onChange={(e) => saveCfg({ swiss_rounds: +e.target.value })} /></label>
          <label>Qualifiés poules<input type="number" min={4} value={cfg.seeds} onChange={(e) => saveCfg({ seeds: +e.target.value })} /></label>
          <label>BO poules<input type="number" min={1} max={7} step={2} value={cfg.bo.poule} onChange={(e) => saveBo({ poule: +e.target.value })} /></label>
          <label>BO quarts<input type="number" min={1} max={7} step={2} value={cfg.bo.quarts} onChange={(e) => saveBo({ quarts: +e.target.value })} /></label>
          <label>BO demies<input type="number" min={1} max={7} step={2} value={cfg.bo.demies} onChange={(e) => saveBo({ demies: +e.target.value })} /></label>
          <label>BO finale<input type="number" min={1} max={9} step={2} value={cfg.bo.finale} onChange={(e) => saveBo({ finale: +e.target.value })} /></label>
        </div>
        <p className="bu-muted" style={{ fontSize: ".8rem", margin: ".5rem 0 0" }}>Complet : suisse 5 rondes, poules/quarts/demies en BO3, finale BO5. Version courte : poules et quarts en BO1.</p>
      </div>

      <div className="br-phasenav">{PHASES.map((p) => <span key={p.key} className={"br-phasetab" + (p.key === phase ? " on" : "")}>{p.label}</span>)}</div>
      {champ && <div className="tlive-champ" style={{ margin: "1rem 0" }}>🏆 Champion : <strong>{nameReq(champ)}</strong></div>}

      {/* Démarrage */}
      {phase === "start" && (
        <div className="bu-card">
          <h3 style={{ marginTop: 0 }}>Ronde suisse</h3>
          <p className="bu-muted" style={{ fontSize: ".85rem" }}>Ajoute d&apos;abord tous les joueurs (ordre d&apos;ajout = seed trophées), puis lance la 1re ronde. {parts.length} joueur{parts.length > 1 ? "s" : ""} inscrit{parts.length > 1 ? "s" : ""}.</p>
          <button className="bu-btn" onClick={genSwissRound} disabled={parts.length < 2}>Lancer la ronde 1</button>
        </div>
      )}

      {/* SUISSE */}
      {phase === "suisse" && (
        <>
          <div className="bu-card">
            <div className="bu-head" style={{ marginBottom: ".8rem" }}>
              <h3 style={{ margin: 0 }}>Ronde suisse — ronde {sRounds}/{cfg.swiss_rounds}</h3>
            </div>
            {Array.from({ length: sRounds }, (_, i) => i + 1).map((r) => {
              const col = sm.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot);
              return (
                <div key={r} style={{ marginBottom: "1rem" }}>
                  <h4 className="brk-h4">Ronde {r}</h4>
                  <div className="cr-duels">{col.map((m) => <Duel key={m.id} m={m} bo={1} nameOf={nameOf} editable onResult={onResult} />)}</div>
                </div>
              );
            })}
            {lastDone && sRounds < cfg.swiss_rounds && <button className="bu-btn" onClick={genSwissRound}>+ Générer la ronde {sRounds + 1}</button>}
          </div>
          <div className="bu-card" style={{ marginTop: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Classement suisse</h3>
            <SwissTable rows={sStand} nameOf={nameReq} qual={cfg.seeds} />
            {lastDone && sRounds >= cfg.swiss_rounds && <button className="bu-btn" style={{ marginTop: ".8rem" }} onClick={toPoules}>Clôturer la suisse → Poules (top {cfg.seeds})</button>}
          </div>
        </>
      )}

      {/* POULES */}
      {phase === "poules" && (
        <div className="bu-card">
          <h3 style={{ marginTop: 0 }}>Poules éliminatoires · BO{cfg.bo.poule}</h3>
          <div className="cr-poules">
            {[0, 1, 2, 3].map((g) => {
              const mem = pouleMembers(g);
              const pm = matches.filter((m) => m.bracket === "P" + g);
              return (
                <div className="cr-poule" key={g}>
                  <h4 className="brk-h4">Poule {pouleLetter(g)}</h4>
                  <PouleTable rows={pouleStandings(mem, pm)} nameOf={nameReq} />
                  <div className="cr-duels" style={{ marginTop: ".5rem" }}>
                    {[1, 2, 3].map((tour) => pm.filter((m) => m.round === tour).sort((a, b) => a.slot - b.slot).map((m) => (
                      <Duel key={m.id} m={m} bo={cfg.bo.poule} nameOf={nameOf} editable onResult={onResult} />
                    )))}
                  </div>
                </div>
              );
            })}
          </div>
          {pMatchesDone && <button className="bu-btn" style={{ marginTop: "1rem" }} onClick={toArbre}>Clôturer les poules → Arbre final (top 2 par poule)</button>}
        </div>
      )}

      {/* ARBRE */}
      {phase === "arbre" && (
        <div className="bu-card">
          <h3 style={{ marginTop: 0 }}>Arbre final</h3>
          <ArbreView matches={matches} cfg={cfg} nameOf={nameOf} editable onResult={onResult} />
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PUBLIC — en direct (lecture seule)
   ================================================================ */
export function ClashRoyaleLive({ t, parts, matches }: { t: Tournament; parts: TParticipant[]; matches: TMatch[] }) {
  const cfg = getCfg(t);
  const nameOf = (id: string | null) => (id ? parts.find((p) => p.id === id)?.name || "—" : "");
  const nameReq = (id: string) => parts.find((p) => p.id === id)?.name || "—";
  const phase = crPhase(matches);
  const sm = matches.filter((m) => m.bracket === "S");
  const sRounds = sm.length ? Math.max(...sm.map((m) => m.round)) : 0;
  const sStand = swissStandings(parts, sm);
  const champ = arbreChampion(matches);
  const srankOf = (() => { const r: Record<string, number> = {}; sStand.forEach((row, i) => (r[row.id] = i + 1)); return r; })();
  const pouleMembers = (g: number) => parts.filter((p) => p.group_no === g).map((p) => ({ id: p.id, srank: srankOf[p.id] ?? 999 })).sort((a, b) => a.srank - b.srank);

  return (
    <div>
      <div className="br-live-sub">{PHASES.find((p) => p.key === phase)?.label || "Ronde suisse"}{phase === "suisse" && sRounds ? ` · Ronde ${sRounds}` : ""}</div>
      {champ && <div className="tlive-champ" style={{ margin: "0 auto 1.2rem", display: "table" }}>🏆 Champion : <strong>{nameReq(champ)}</strong></div>}

      {phase === "suisse" && (
        <div className="br-live-grid">
          <div className="br-live-rank"><h3 className="brk-h4">Classement suisse</h3><SwissTable rows={sStand} nameOf={nameReq} qual={cfg.seeds} /></div>
          <div className="br-live-lob"><h3 className="brk-h4">Ronde {sRounds}</h3>
            <div className="cr-duels">{sm.filter((m) => m.round === sRounds).sort((a, b) => a.slot - b.slot).map((m) => <Duel key={m.id} m={m} bo={1} nameOf={nameOf} editable={false} />)}</div>
          </div>
        </div>
      )}

      {phase === "poules" && (
        <div className="cr-poules">
          {[0, 1, 2, 3].map((g) => {
            const pm = matches.filter((m) => m.bracket === "P" + g);
            return (
              <div className="cr-poule" key={g}>
                <h4 className="brk-h4">Poule {pouleLetter(g)}</h4>
                <PouleTable rows={pouleStandings(pouleMembers(g), pm)} nameOf={nameReq} />
                <div className="cr-duels" style={{ marginTop: ".5rem" }}>
                  {[1, 2, 3].map((tour) => pm.filter((m) => m.round === tour).sort((a, b) => a.slot - b.slot).map((m) => <Duel key={m.id} m={m} bo={cfg.bo.poule} nameOf={nameOf} editable={false} />))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {phase === "arbre" && <ArbreView matches={matches} cfg={cfg} nameOf={nameOf} editable={false} />}
      {phase === "start" && <p className="tlive-msg">Le tournoi va bientôt commencer.</p>}
    </div>
  );
}
