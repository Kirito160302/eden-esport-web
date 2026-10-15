"use client";
/* ================================================================
   TOURNOIS — gestion (bureau) + vue publique en direct
   Formats : élimination directe · double élimination · championnat
   (round robin) · poules + phase finale · free play.
   Moteur d'avancement générique par liens win_to / lose_to.
   ================================================================ */
import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { BattleRoyaleAdmin, BattleRoyaleLive, type BRResult } from "./BattleRoyale";
import { ClashRoyaleAdmin, ClashRoyaleLive } from "./ClashRoyale";

const supabase = getSupabase();
const BYE = "BYE";

export type Format = "single_elim" | "double_elim" | "round_robin" | "groups_knockout" | "freeplay" | "battle_royale" | "clash_1v1";
export type Tournament = {
  id: string; name: string; game: string | null; format: Format;
  team_mode: boolean; status: "draft" | "open" | "running" | "done";
  is_public: boolean; event_label: string | null; created_at?: string;
};
export type TParticipant = { id: string; tournament_id: string; name: string; seed: number; group_no: number | null; br_phase?: string | null };
export type TMatch = {
  id: string; tournament_id: string; bracket: string | null; round: number; slot: number;
  p1_id: string | null; p2_id: string | null; winner_id: string | null;
  score: string | null; status: string; win_to: string | null; lose_to: string | null;
};

/* ---------- Génération (en mémoire, BYE puis sérialisation) ------ */
function seedSlots(size: number): number[] {
  let s = [1, 2]; const r = Math.log2(size);
  for (let i = 1; i < r; i++) { const sum = s.length * 2 + 1; const n: number[] = []; for (const x of s) { n.push(x); n.push(sum - x); } s = n; }
  return s;
}
function pow2(n: number): number { let s = 1; while (s < n) s *= 2; return Math.max(2, s); }

type Mem = { bracket: string; round: number; slot: number; p1: string | null; p2: string | null; win: string | null; win_to: string | null; lose_to: string | null; done: boolean };
const slotId = (order: number[], ids: string[], pos: number): string => { const seed = order[pos]; return seed - 1 < ids.length ? ids[seed - 1] : BYE; };

function genSingle(ids: string[], bracket = "W"): Mem[] {
  const size = pow2(ids.length), k = Math.log2(size), order = seedSlots(size);
  const M: Mem[] = [];
  for (let r = 1; r <= k; r++) {
    const c = size / 2 ** r;
    for (let s = 0; s < c; s++) {
      const m: Mem = { bracket, round: r, slot: s, p1: null, p2: null, win: null, win_to: null, lose_to: null, done: false };
      if (r === 1) { m.p1 = slotId(order, ids, 2 * s); m.p2 = slotId(order, ids, 2 * s + 1); }
      if (r < k) m.win_to = `${bracket}:${r + 1}:${Math.floor(s / 2)}:${s % 2 === 0 ? 1 : 2}`;
      M.push(m);
    }
  }
  return M;
}
function genDouble(ids: string[]): Mem[] {
  const size = pow2(ids.length), k = Math.log2(size), order = seedSlots(size);
  const M: Mem[] = [];
  const GF: Mem = { bracket: "GF", round: 1, slot: 0, p1: null, p2: null, win: null, win_to: null, lose_to: null, done: false };
  if (k === 1) {
    M.push({ bracket: "W", round: 1, slot: 0, p1: slotId(order, ids, 0), p2: slotId(order, ids, 1), win: null, win_to: "GF:1:0:1", lose_to: "GF:1:0:2", done: false });
    M.push(GF); return M;
  }
  const lbRounds = 2 * (k - 1);
  const lbCount = (j: number) => { const p = Math.ceil(j / 2); return size / 2 ** (p + 1); };
  for (let r = 1; r <= k; r++) {
    const c = size / 2 ** r;
    for (let s = 0; s < c; s++) {
      const m: Mem = { bracket: "W", round: r, slot: s, p1: null, p2: null, win: null, win_to: null, lose_to: null, done: false };
      if (r === 1) { m.p1 = slotId(order, ids, 2 * s); m.p2 = slotId(order, ids, 2 * s + 1); }
      m.win_to = r < k ? `W:${r + 1}:${Math.floor(s / 2)}:${s % 2 === 0 ? 1 : 2}` : "GF:1:0:1";
      m.lose_to = r === 1 ? `L:1:${Math.floor(s / 2)}:${s % 2 === 0 ? 1 : 2}` : `L:${2 * (r - 1)}:${s}:2`;
      M.push(m);
    }
  }
  for (let j = 1; j <= lbRounds; j++) {
    const c = lbCount(j);
    for (let s = 0; s < c; s++) {
      const m: Mem = { bracket: "L", round: j, slot: s, p1: null, p2: null, win: null, win_to: null, lose_to: null, done: false };
      if (j === lbRounds) m.win_to = "GF:1:0:2";
      else { const cn = lbCount(j + 1); m.win_to = cn === c ? `L:${j + 1}:${s}:1` : `L:${j + 1}:${Math.floor(s / 2)}:${s % 2 === 0 ? 1 : 2}`; }
      M.push(m);
    }
  }
  M.push(GF);
  return M;
}
function genRR(ids: string[]): Mem[] {
  const M: Mem[] = []; let s = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
    M.push({ bracket: "RR", round: 0, slot: s++, p1: ids[i], p2: ids[j], win: null, win_to: null, lose_to: null, done: false });
  return M;
}

// Résout les exempts (BYE) en cascade, puis sérialise en lignes DB.
function resolveAndSerialize(mem: Mem[], tournamentId: string): Omit<TMatch, "id">[] {
  const find = (ref: string) => { const [b, r, s] = ref.split(":"); return mem.find((m) => m.bracket === b && m.round === +r && m.slot === +s); };
  const place = (ref: string, who: string) => { const parts = ref.split(":"); const t = find(parts.slice(0, 3).join(":")); if (!t) return; if (+parts[3] === 1) t.p1 = who; else t.p2 = who; };
  let guard = 0;
  while (guard++ < 2000) {
    const m = mem.find((x) => !x.done && x.p1 != null && x.p2 != null && (x.p1 === BYE || x.p2 === BYE));
    if (!m) break;
    const winner = m.p1 === BYE ? m.p2! : m.p1!; // si les deux BYE → BYE
    const loser = m.p1 === BYE ? m.p1! : m.p2!;
    m.win = winner; m.done = true;
    if (m.win_to && winner !== BYE) place(m.win_to, winner);
    if (m.win_to && winner === BYE) place(m.win_to, BYE);
    if (m.lose_to) place(m.lose_to, loser);
  }
  return mem.map((m) => ({
    tournament_id: tournamentId, bracket: m.bracket, round: m.round, slot: m.slot,
    p1_id: m.p1 === BYE ? null : m.p1, p2_id: m.p2 === BYE ? null : m.p2,
    winner_id: m.win === BYE ? null : m.win, score: m.done ? "exempt" : null,
    status: m.done ? "done" : "pending", win_to: m.win_to, lose_to: m.lose_to,
  }));
}

/* ---------- Avancement au moment d'un résultat (DB) ------------- */
async function applyResult(m: TMatch, winnerId: string, score: string | null, all: TMatch[]) {
  if (!supabase) return;
  const loserId = winnerId === m.p1_id ? m.p2_id : m.p1_id;
  await supabase.from("tournament_matches").update({ winner_id: winnerId, score, status: "done" }).eq("id", m.id);
  const push = async (ref: string | null, who: string | null) => {
    if (!ref || !who) return;
    const [b, r, s, side] = ref.split(":");
    const t = all.find((x) => x.bracket === b && x.round === +r && x.slot === +s);
    if (t) await supabase!.from("tournament_matches").update({ [+side === 1 ? "p1_id" : "p2_id"]: who }).eq("id", t.id);
  };
  await push(m.win_to, winnerId);
  await push(m.lose_to, loserId);
}

/* ---------- Classement (championnat / poules) ------------------- */
type Row = { id: string; pj: number; v: number; d: number; pts: number; diff: number };
function standings(matches: TMatch[], ids: string[]): Row[] {
  const map: Record<string, Row> = {};
  for (const id of ids) map[id] = { id, pj: 0, v: 0, d: 0, pts: 0, diff: 0 };
  for (const m of matches) {
    if (!m.winner_id || !m.p1_id || !m.p2_id) continue;
    const loser = m.winner_id === m.p1_id ? m.p2_id : m.p1_id;
    if (map[m.winner_id]) { map[m.winner_id].pj++; map[m.winner_id].v++; map[m.winner_id].pts += 3; }
    if (map[loser]) { map[loser].pj++; map[loser].d++; }
    const sc = (m.score || "").match(/(\d+)\s*[-:]\s*(\d+)/);
    if (sc && map[m.winner_id]) {
      const a = +sc[1], b = +sc[2], hi = Math.max(a, b), lo = Math.min(a, b);
      map[m.winner_id].diff += hi - lo; if (map[loser]) map[loser].diff -= hi - lo;
    }
  }
  return Object.values(map).sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.v - a.v);
}

const FORMATS: { key: Format; label: string }[] = [
  { key: "single_elim", label: "Élimination directe" },
  { key: "double_elim", label: "Double élimination" },
  { key: "round_robin", label: "Championnat (toutes rondes)" },
  { key: "groups_knockout", label: "Poules + phase finale" },
  { key: "battle_royale", label: "Battle Royale (points / manches)" },
  { key: "clash_1v1", label: "Clash Royale 1v1 (suisse + poules + arbre)" },
  { key: "freeplay", label: "Free play (liste simple)" },
];
const formatLabel = (f: string) => FORMATS.find((x) => x.key === f)?.label || f;
const roundName = (round: number, total: number): string => {
  const e = total - round;
  if (e === 0) return "Finale"; if (e === 1) return "Demi-finales"; if (e === 2) return "Quarts"; if (e === 3) return "8es"; if (e === 4) return "16es";
  return `Tour ${round}`;
};

/* ================================================================
   RENDU PARTAGÉ (bureau éditable + public lecture seule)
   ================================================================ */
function BracketCols({ matches, nameOf, label, editable, onResult }: {
  matches: TMatch[]; nameOf: (id: string | null) => string | null; label: (r: number, total: number) => string;
  editable: boolean; onResult?: (m: TMatch, w: string, score: string) => void;
}) {
  const [edit, setEdit] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const rounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0;
  return (
    <div className="brk">
      {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
        const col = matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot);
        if (!col.length) return null;
        return (
          <div className="brk-round" key={r}>
            <div className="brk-round-h">{label(r, rounds)}</div>
            {col.map((m) => {
              const p1 = nameOf(m.p1_id), p2 = nameOf(m.p2_id);
              if (m.status === "done" && !m.winner_id && !m.p1_id && !m.p2_id) return null; // match "vide" (exempts)
              const ready = !!m.p1_id && !!m.p2_id && m.status !== "done";
              return (
                <div className={"brk-match" + (m.status === "done" ? " done" : "")} key={m.id}>
                  <div className={"brk-team" + (m.winner_id && m.winner_id === m.p1_id ? " win" : "")}>
                    <span className="brk-nm">{p1 || <em>à venir</em>}</span>
                    {editable && ready && <button className="brk-pick" onClick={() => onResult?.(m, m.p1_id!, score)} title="Vainqueur">▲</button>}
                  </div>
                  <div className={"brk-team" + (m.winner_id && m.winner_id === m.p2_id ? " win" : "")}>
                    <span className="brk-nm">{p2 || <em>à venir</em>}</span>
                    {editable && ready && <button className="brk-pick" onClick={() => onResult?.(m, m.p2_id!, score)} title="Vainqueur">▲</button>}
                  </div>
                  {m.score && m.score !== "exempt" ? <div className="brk-sc">{m.score}</div> : null}
                  {editable && ready && (edit === m.id ? (
                    <div className="brk-ed"><input value={score} onChange={(e) => setScore(e.target.value)} placeholder="score 2-1" /><button className="bu-btn bu-btn--sm" onClick={() => setEdit(null)}>ok</button></div>
                  ) : <button className="brk-score-btn" onClick={() => { setEdit(m.id); setScore(m.score || ""); }}>+ score</button>)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function StandingsTable({ rows, nameOf }: { rows: Row[]; nameOf: (id: string) => string }) {
  return (
    <table className="brk-rank">
      <thead><tr><th>#</th><th>Équipe / joueur</th><th>J</th><th>V</th><th>D</th><th>Diff</th><th>Pts</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id} className={i < 2 ? "qual" : ""}>
            <td>{i + 1}</td><td className="nm">{nameOf(r.id)}</td><td>{r.pj}</td><td>{r.v}</td><td>{r.d}</td><td>{r.diff > 0 ? "+" + r.diff : r.diff}</td><td><b>{r.pts}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Liste de matchs (championnat / poules) avec saisie de résultat
function MatchList({ matches, nameOf, editable, onResult }: {
  matches: TMatch[]; nameOf: (id: string | null) => string | null; editable: boolean; onResult?: (m: TMatch, w: string, score: string) => void;
}) {
  const [edit, setEdit] = useState<string | null>(null);
  const [score, setScore] = useState("");
  return (
    <div className="brk-ml">
      {matches.map((m) => (
        <div className={"brk-mlrow" + (m.winner_id ? " done" : "")} key={m.id}>
          <span className={"brk-mlp" + (m.winner_id === m.p1_id ? " win" : "")}>{nameOf(m.p1_id)}</span>
          <span className="brk-mlvs">{m.score && m.score !== "exempt" ? m.score : "vs"}</span>
          <span className={"brk-mlp r" + (m.winner_id === m.p2_id ? " win" : "")}>{nameOf(m.p2_id)}</span>
          {editable && m.p1_id && m.p2_id && (edit === m.id ? (
            <span className="brk-mled">
              <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="2-1" />
              <button className="bu-btn bu-btn--sm" onClick={() => { onResult?.(m, m.p1_id!, score); setEdit(null); }}>{nameOf(m.p1_id)} ✓</button>
              <button className="bu-btn bu-btn--sm" onClick={() => { onResult?.(m, m.p2_id!, score); setEdit(null); }}>{nameOf(m.p2_id)} ✓</button>
            </span>
          ) : <button className="brk-score-btn" onClick={() => { setEdit(m.id); setScore(m.score || ""); }}>{m.winner_id ? "modifier" : "saisir"}</button>)}
        </div>
      ))}
    </div>
  );
}

// Vue complète d'un tournoi (selon le format) — partagée bureau/public
export function TournamentView({ t, parts, matches, editable, onResult }: {
  t: Tournament; parts: TParticipant[]; matches: TMatch[]; editable: boolean;
  onResult?: (m: TMatch, w: string, score: string) => void;
}) {
  const nameOf = (id: string | null) => (id ? parts.find((p) => p.id === id)?.name || "—" : null);
  const nameReq = (id: string) => parts.find((p) => p.id === id)?.name || "—";

  if (t.format === "freeplay") {
    return <div className="tlive-list">{parts.map((p, i) => <div className="tlive-pp" key={p.id}><b>{i + 1}</b> {p.name}</div>)}</div>;
  }
  if (t.format === "round_robin") {
    const rr = matches.filter((m) => m.bracket === "RR");
    return (
      <div className="brk-rrwrap">
        <StandingsTable rows={standings(rr, parts.map((p) => p.id))} nameOf={nameReq} />
        <h4 className="brk-h4">Matchs</h4>
        <MatchList matches={rr} nameOf={nameOf} editable={editable} onResult={onResult} />
      </div>
    );
  }
  if (t.format === "groups_knockout") {
    const groupsNos = Array.from(new Set(parts.map((p) => p.group_no).filter((g): g is number => g != null))).sort((a, b) => a - b);
    const ko = matches.filter((m) => m.bracket === "W");
    return (
      <div>
        <div className="brk-groups">
          {groupsNos.map((g) => {
            const gp = parts.filter((p) => p.group_no === g);
            const gm = matches.filter((m) => m.bracket === "G" && gp.some((x) => x.id === m.p1_id));
            return (
              <div className="brk-group" key={g}>
                <h4 className="brk-h4">Poule {String.fromCharCode(65 + g)}</h4>
                <StandingsTable rows={standings(gm, gp.map((p) => p.id))} nameOf={nameReq} />
                <MatchList matches={gm} nameOf={nameOf} editable={editable} onResult={onResult} />
              </div>
            );
          })}
        </div>
        {ko.length > 0 && (
          <div style={{ marginTop: "1.4rem" }}>
            <h4 className="brk-h4">Phase finale</h4>
            <BracketCols matches={ko} nameOf={nameOf} label={roundName} editable={editable} onResult={onResult} />
          </div>
        )}
      </div>
    );
  }
  // single / double elimination
  const W = matches.filter((m) => m.bracket === "W");
  const L = matches.filter((m) => m.bracket === "L");
  const GF = matches.filter((m) => m.bracket === "GF");
  return (
    <div>
      {t.format === "double_elim" && L.length > 0 && <div className="brk-secth">Arbre principal</div>}
      <BracketCols matches={W} nameOf={nameOf} label={roundName} editable={editable} onResult={onResult} />
      {L.length > 0 && (<><div className="brk-secth">Arbre des perdants</div>
        <BracketCols matches={L} nameOf={nameOf} label={(r) => `Tour ${r}`} editable={editable} onResult={onResult} /></>)}
      {GF.length > 0 && (<><div className="brk-secth">Grande finale</div>
        <BracketCols matches={GF} nameOf={nameOf} label={() => "Grande finale"} editable={editable} onResult={onResult} /></>)}
    </div>
  );
}

/* ================================================================
   BUREAU — gestion
   ================================================================ */
export function TournoisModule() {
  const [list, setList] = useState<Tournament[]>([]);
  const [sel, setSel] = useState<Tournament | null>(null);
  const [parts, setParts] = useState<TParticipant[]>([]);
  const [matches, setMatches] = useState<TMatch[]>([]);
  const [err, setErr] = useState(false);
  const [nName, setNName] = useState(""); const [nGame, setNGame] = useState("");
  const [nTeam, setNTeam] = useState("solo"); const [nFormat, setNFormat] = useState<Format>("single_elim");
  const [nGroups, setNGroups] = useState("2");
  const [pName, setPName] = useState(""); const [copied, setCopied] = useState(false);

  const loadList = useCallback(async () => {
    if (!supabase) return;
    const r = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
    if (r.error) { setErr(true); return; } setErr(false); setList((r.data as Tournament[]) || []);
  }, []);
  const loadOne = useCallback(async (id: string) => {
    if (!supabase) return;
    const [p, m] = await Promise.all([
      supabase.from("tournament_participants").select("*").eq("tournament_id", id).order("seed"),
      supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("round").order("slot"),
    ]);
    setParts((p.data as TParticipant[]) || []); setMatches((m.data as TMatch[]) || []);
  }, []);
  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (sel) loadOne(sel.id); }, [sel, loadOne]);

  async function createT() {
    if (!supabase || !nName.trim()) return;
    const { data, error } = await supabase.from("tournaments").insert({
      name: nName.trim(), game: nGame.trim() || null, team_mode: nTeam === "team", format: nFormat, status: "open", is_public: true,
    }).select().single();
    if (error) { alert("Création impossible : " + error.message); return; }
    setNName(""); setNGame(""); await loadList(); setSel(data as Tournament);
  }
  async function addP() {
    if (!supabase || !sel || !pName.trim()) return;
    const seed = (parts.length ? Math.max(...parts.map((p) => p.seed)) : 0) + 1;
    await supabase.from("tournament_participants").insert({ tournament_id: sel.id, name: pName.trim(), seed });
    setPName(""); loadOne(sel.id);
  }
  async function delP(id: string) { if (!supabase || !sel) return; await supabase.from("tournament_participants").delete().eq("id", id); loadOne(sel.id); }

  async function insertMem(mem: Mem[]) {
    if (!supabase || !sel) return;
    await supabase.from("tournament_matches").delete().eq("tournament_id", sel.id);
    const rows = resolveAndSerialize(mem, sel.id);
    await supabase.from("tournament_matches").insert(rows);
    await supabase.from("tournaments").update({ status: "running" }).eq("id", sel.id);
    await loadList(); loadOne(sel.id);
  }
  async function generate() {
    if (!supabase || !sel) return;
    if (matches.length && !confirm("Regénérer ? Les résultats actuels seront effacés.")) return;
    const ids = parts.map((p) => p.id);
    if (sel.format === "single_elim" || sel.format === "double_elim") {
      if (ids.length < 2) { alert("Au moins 2 participants."); return; }
      await insertMem(sel.format === "single_elim" ? genSingle(ids) : genDouble(ids));
    } else if (sel.format === "round_robin") {
      if (ids.length < 2) { alert("Au moins 2 participants."); return; }
      await insertMem(genRR(ids));
    } else if (sel.format === "groups_knockout") {
      const G = Math.max(2, Math.min(parseInt(nGroups) || 2, Math.floor(ids.length / 2)));
      if (ids.length < 4) { alert("Au moins 4 participants pour des poules."); return; }
      // assigne les poules (serpentin) + matchs de poule
      const mem: Mem[] = []; let s = 0;
      const groups: string[][] = Array.from({ length: G }, () => []);
      parts.forEach((p, i) => groups[i % G].push(p.id));
      for (let gi = 0; gi < G; gi++) {
        for (const p of groups[gi]) await supabase.from("tournament_participants").update({ group_no: gi }).eq("id", p);
        const g = groups[gi];
        for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++)
          mem.push({ bracket: "G", round: 0, slot: s++, p1: g[i], p2: g[j], win: null, win_to: null, lose_to: null, done: false });
      }
      await insertMem(mem);
    }
  }
  async function launchKO() {
    if (!supabase || !sel) return;
    // top 2 de chaque poule (classement), ordre 1ers puis 2es
    const groupsNos = Array.from(new Set(parts.map((p) => p.group_no).filter((g): g is number => g != null))).sort((a, b) => a - b);
    const firsts: string[] = [], seconds: string[] = [];
    for (const g of groupsNos) {
      const gp = parts.filter((p) => p.group_no === g);
      const gm = matches.filter((m) => m.bracket === "G" && gp.some((x) => x.id === m.p1_id));
      const rows = standings(gm, gp.map((p) => p.id));
      if (rows[0]) firsts.push(rows[0].id); if (rows[1]) seconds.push(rows[1].id);
    }
    const qualifiers = [...firsts, ...seconds];
    if (qualifiers.length < 2) { alert("Pas assez de qualifiés."); return; }
    const ko = genSingle(qualifiers, "W");
    const rows = resolveAndSerialize(ko, sel.id);
    await supabase.from("tournament_matches").delete().eq("tournament_id", sel.id).eq("bracket", "W");
    await supabase.from("tournament_matches").insert(rows);
    loadOne(sel.id);
  }
  async function onResult(m: TMatch, w: string, score: string) {
    await applyResult(m, w, score || null, matches);
    if (sel) {
      // fin de tournoi ?
      const done = (b: string) => { const col = matches.filter((x) => x.bracket === b); return col.length && col[col.length - 1]; };
      const finalM = sel.format === "double_elim" ? done("GF") : (sel.format === "round_robin" ? null : done("W"));
      if (finalM && m.id === (finalM as TMatch).id) await supabase?.from("tournaments").update({ status: "done" }).eq("id", sel.id);
      loadOne(sel.id); loadList();
    }
  }
  async function delT(id: string) { if (!supabase || !confirm("Supprimer ce tournoi ?")) return; await supabase.from("tournaments").delete().eq("id", id); setSel(null); loadList(); }

  const publicUrl = sel ? `${typeof window !== "undefined" ? window.location.origin : ""}/tournoi/${sel.id}` : "";
  if (err) return <div className="bu-empty">Module non activé (tables « tournaments » absentes). Lance le SQL fourni.</div>;

  if (sel) {
    const hasBracket = sel.format === "single_elim" || sel.format === "double_elim";
    const groupStageDone = sel.format === "groups_knockout" && matches.filter((m) => m.bracket === "G").length > 0 && matches.filter((m) => m.bracket === "G").every((m) => m.winner_id);
    const koExists = matches.some((m) => m.bracket === "W");
    return (
      <div>
        <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => setSel(null)}>← Tous les tournois</button>
        <div className="bu-head" style={{ marginTop: ".8rem" }}>
          <h2 style={{ margin: 0 }}>{sel.name}</h2>
          <span className="bu-crumb">{sel.game || "—"} · {sel.team_mode ? "Équipes" : "Solo"} · {formatLabel(sel.format)}</span>
        </div>
        <div className="brk-toolbar">
          <a className="bu-btn bu-btn--sm" href={publicUrl} target="_blank" rel="noopener noreferrer">Vue publique ↗</a>
          <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => { navigator.clipboard?.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Lien copié ✓" : "Copier le lien public"}</button>
          <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => delT(sel.id)} style={{ marginLeft: "auto", color: "#c96" }}>Supprimer</button>
        </div>

        <div className="bu-card" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Participants ({parts.length})</h3>
          <div className="brk-addp">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder={sel.team_mode ? "Nom de l'équipe" : "Pseudo"} onKeyDown={(e) => { if (e.key === "Enter") addP(); }} />
            <button className="bu-btn bu-btn--sm" onClick={addP}>+ Ajouter</button>
          </div>
          <div className="brk-plist">
            {parts.map((p, i) => <span className="brk-pchip" key={p.id}><b>{i + 1}.</b> {p.name}<button onClick={() => delP(p.id)} title="Retirer">✕</button></span>)}
            {parts.length === 0 && <span className="bu-muted">Ajoute les joueurs/équipes.</span>}
          </div>
          {sel.format !== "freeplay" && sel.format !== "battle_royale" && sel.format !== "clash_1v1" && (
            <div style={{ marginTop: ".8rem", display: "flex", gap: ".6rem", flexWrap: "wrap", alignItems: "center" }}>
              {sel.format === "groups_knockout" && (
                <label className="bu-muted" style={{ fontSize: ".85rem", display: "flex", gap: ".4rem", alignItems: "center" }}>
                  Nombre de poules <input type="number" min={2} max={8} value={nGroups} onChange={(e) => setNGroups(e.target.value)} style={{ width: 60 }} className="brk-numin" />
                </label>
              )}
              <button className="bu-btn" onClick={generate} disabled={parts.length < 2}>
                {matches.length ? "Regénérer" : sel.format === "round_robin" ? "Générer le championnat" : sel.format === "groups_knockout" ? "Générer les poules" : "Générer l'arbre"}
              </button>
              {sel.format === "groups_knockout" && groupStageDone && !koExists && (
                <button className="bu-btn" onClick={launchKO}>Lancer la phase finale →</button>
              )}
            </div>
          )}
        </div>

        {sel.format === "battle_royale" && (
          <BattleRoyaleAdmin t={sel} parts={parts} reload={() => { loadOne(sel.id); loadList(); }} />
        )}

        {sel.format === "clash_1v1" && (
          <ClashRoyaleAdmin t={sel} parts={parts} matches={matches} reload={() => { loadOne(sel.id); loadList(); }} />
        )}

        {sel.format !== "freeplay" && sel.format !== "battle_royale" && sel.format !== "clash_1v1" && matches.length > 0 && (
          <div style={{ marginTop: "1.2rem" }}>
            <TournamentView t={sel} parts={parts} matches={matches} editable onResult={onResult} />
            <p className="bu-muted" style={{ fontSize: ".82rem", marginTop: ".6rem" }}>
              {hasBracket ? "Clique sur ▲ à côté du vainqueur pour le faire avancer. « + score » pour noter le score." : "Saisis le vainqueur de chaque match ; le classement se met à jour tout seul."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="bu-card">
        <h3 style={{ marginTop: 0 }}>Nouveau tournoi</h3>
        <div className="brk-create">
          <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Nom (ex : Tournoi Valorant VGW)" />
          <input value={nGame} onChange={(e) => setNGame(e.target.value)} placeholder="Jeu (ex : Valorant)" />
          <select value={nTeam} onChange={(e) => setNTeam(e.target.value)}><option value="solo">Solo</option><option value="team">Équipes</option></select>
          <select value={nFormat} onChange={(e) => setNFormat(e.target.value as Format)}>
            {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <button className="bu-btn" onClick={createT} disabled={!nName.trim()}>Créer</button>
        </div>
      </div>
      <div style={{ marginTop: "1rem" }} className="brk-tlist">
        {list.length === 0 ? <p className="bu-muted">Aucun tournoi pour l&apos;instant.</p> : list.map((t) => (
          <button className="bu-card brk-tcard" key={t.id} onClick={() => setSel(t)}>
            <div><strong>{t.name}</strong><div className="bu-muted" style={{ fontSize: ".84rem" }}>{t.game || "—"} · {t.team_mode ? "Équipes" : "Solo"} · {formatLabel(t.format)}</div></div>
            <span className={"brk-status brk-" + t.status}>{t.status === "done" ? "Terminé" : t.status === "running" ? "En cours" : "Ouvert"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   PUBLIC — vue en direct (lecture seule, auto-rafraîchie)
   ================================================================ */
export default function TournamentLive({ id }: { id: string }) {
  const [t, setT] = useState<Tournament | null>(null);
  const [parts, setParts] = useState<TParticipant[]>([]);
  const [matches, setMatches] = useState<TMatch[]>([]);
  const [brRes, setBrRes] = useState<BRResult[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setState("notfound"); return; }
    const tr = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (!tr.data) { setState("notfound"); return; }
    const [p, m, br] = await Promise.all([
      supabase.from("tournament_participants").select("*").eq("tournament_id", id).order("seed"),
      supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("round").order("slot"),
      supabase.from("br_results").select("*").eq("tournament_id", id).order("round_no").order("lobby_no"),
    ]);
    setT(tr.data as Tournament); setParts((p.data as TParticipant[]) || []); setMatches((m.data as TMatch[]) || []);
    setBrRes((br.data as BRResult[]) || []); setState("ok");
  }, [id]);

  useEffect(() => { load(); timer.current = window.setInterval(load, 12000); return () => { if (timer.current) window.clearInterval(timer.current); }; }, [load]);

  if (state === "loading") return <div className="tlive"><p className="tlive-msg">Chargement…</p></div>;
  if (state === "notfound" || !t) return <div className="tlive"><p className="tlive-msg">Tournoi introuvable.</p></div>;

  const champ = (() => {
    if (t.format === "battle_royale" || t.format === "clash_1v1" || t.format === "freeplay") return null;
    if (t.format === "round_robin") { const r = standings(matches.filter((m) => m.bracket === "RR"), parts.map((p) => p.id)); return matches.some((m) => m.winner_id) && r[0] ? parts.find((p) => p.id === r[0].id)?.name : null; }
    const last = (t.format === "double_elim" ? matches.filter((m) => m.bracket === "GF") : matches.filter((m) => m.bracket === "W")).slice(-1)[0];
    return last?.winner_id ? parts.find((p) => p.id === last.winner_id)?.name : null;
  })();

  return (
    <div className="tlive">
      <header className="tlive-head">
        <div className="tlive-brand">EDEN<span>ESPORT</span></div>
        <h1>{t.name}</h1>
        <p>{t.game || ""}{t.game ? " · " : ""}{formatLabel(t.format)} · {parts.length} participants</p>
        {champ && <div className="tlive-champ">🏆 Vainqueur : <strong>{champ}</strong></div>}
      </header>
      {t.format === "battle_royale"
        ? <BattleRoyaleLive t={t} parts={parts} results={brRes} />
        : t.format === "clash_1v1"
        ? <ClashRoyaleLive t={t} parts={parts} matches={matches} />
        : <TournamentView t={t} parts={parts} matches={matches} editable={false} />}
      <footer className="tlive-foot">Mise à jour automatique · edenesport.fr</footer>
    </div>
  );
}
