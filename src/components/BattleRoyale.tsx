"use client";
/* ================================================================
   BATTLE ROYALE / points par manche — format "suisse + poules"
   Phase 1 Ronde suisse (regroupement par niveau) → Phase 2 Poules
   éliminatoires (seeds en serpentin) → Phase 3 Demi-finales (croisement)
   → Phase 4 Finale Match Point. Points cumulés, salons, en direct.
   ================================================================ */
import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Tournament, TParticipant } from "./Tournois";

const supabase = getSupabase();

export const SCHEME: Record<number, number[]> = { 5: [10, 7, 5, 3, 1], 4: [10, 7, 4, 2], 3: [10, 7, 4], 2: [10, 7], 1: [10] };
export const brPoints = (size: number, placement: number) => (SCHEME[size] || [])[placement - 1] ?? 0;
export type BRConfig = { lobby_size: number; qualify_poules: number; match_point: number };
export const BR_DEFAULT: BRConfig = { lobby_size: 5, qualify_poules: 16, match_point: 20 };
export type BRResult = { id: string; tournament_id: string; phase: string; round_no: number; lobby_no: number; participant_id: string; placement: number | null; points: number | null };

// clé de phase 'qualif' = Ronde suisse (on garde 'qualif' = défaut de br_phase, pas de SQL à relancer)
const PHASES = [
  { key: "qualif", label: "Ronde suisse" },
  { key: "poules", label: "Poules éliminatoires" },
  { key: "demi", label: "Demi-finales" },
  { key: "finale", label: "Finale" },
];
const phaseLabel = (p: string) => PHASES.find((x) => x.key === p)?.label || p;

// Tailles de salons : max 5, min 4, k = ceil(n/5), les salons de 5 d'abord.
function lobbySizes(n: number): number[] { const k = Math.max(1, Math.ceil(n / 5)); return sizesFor(n, k); }
function sizesFor(n: number, k: number): number[] { const base = Math.floor(n / k); const extra = n - base * k; return Array.from({ length: k }, (_, i) => base + (i < extra ? 1 : 0)); }
// Répartit des ids triés dans des salons de tailles données. mode 'blocks' (par niveau) ou 'serp'.
function distribute(ids: string[], sizes: number[], mode: "blocks" | "serp"): string[][] {
  const lob: string[][] = sizes.map(() => []);
  if (mode === "blocks") { let i = 0; for (let l = 0; l < sizes.length; l++) for (let s = 0; s < sizes[l]; s++) if (ids[i]) lob[l].push(ids[i++]); return lob; }
  let i = 0, dir = 1, l = 0; const cap = (s: number) => lob[s].length < sizes[s];
  for (const id of ids) {
    let guard = 0; while (!cap(l) && guard++ < 100) { l += dir; if (l < 0) { l = 0; dir = 1; } if (l >= sizes.length) { l = sizes.length - 1; dir = -1; } }
    lob[l].push(id); l += dir; if (l < 0) { l = 0; dir = 1; } if (l >= sizes.length) { l = sizes.length - 1; dir = -1; }
  }
  return lob;
}

type Row = { id: string; pts: number; top1: number; top2: number; pj: number; seed: number };
function standings(res: BRResult[], phase: string, active: TParticipant[]): Row[] {
  const map: Record<string, Row> = {};
  for (const p of active) map[p.id] = { id: p.id, pts: 0, top1: 0, top2: 0, pj: 0, seed: p.seed };
  for (const r of res) {
    if (r.phase !== phase || !map[r.participant_id] || r.placement == null) continue;
    const m = map[r.participant_id]; m.pts += r.points || 0; m.pj++;
    if (r.placement === 1) m.top1++; if (r.placement === 2) m.top2++;
  }
  return Object.values(map).sort((a, b) => b.pts - a.pts || b.top1 - a.top1 || b.top2 - a.top2 || a.seed - b.seed);
}
function lobbyStandings(res: BRResult[], phase: string, active: TParticipant[], groupNo: number): Row[] {
  return standings(res, phase, active.filter((p) => (p.group_no ?? 0) === groupNo));
}
function finaleChampion(res: BRResult[], ids: string[], MP: number): string | null {
  const rounds = Array.from(new Set(res.filter((r) => r.phase === "finale").map((r) => r.round_no))).sort((a, b) => a - b);
  const tot: Record<string, number> = {}; ids.forEach((i) => (tot[i] = 0));
  for (const rn of rounds) {
    const rows = res.filter((r) => r.phase === "finale" && r.round_no === rn);
    if (rows.some((r) => r.placement == null)) break;
    for (const r of rows) if (tot[r.participant_id] >= MP && r.placement === 1) return r.participant_id;
    for (const r of rows) tot[r.participant_id] += r.points || 0;
  }
  return null;
}

function BRStand({ rows, nameOf, qual }: { rows: Row[]; nameOf: (id: string) => string; qual: number }) {
  return (
    <table className="brk-rank">
      <thead><tr><th>#</th><th>Duo / équipe</th><th>Pts</th><th>Top1</th><th>Top2</th><th>J</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={r.id} className={i < qual ? "qual" : ""}>
          <td>{i + 1}</td><td className="nm">{nameOf(r.id)}</td><td><b>{r.pts}</b></td><td>{r.top1}</td><td>{r.top2}</td><td>{r.pj}</td>
        </tr>))}
      </tbody>
    </table>
  );
}

/* ================================================================
   BUREAU
   ================================================================ */
export function BattleRoyaleAdmin({ t, parts, reload }: { t: Tournament; parts: TParticipant[]; reload: () => void }) {
  const [res, setRes] = useState<BRResult[]>([]);
  const cfg: BRConfig = { ...BR_DEFAULT, ...((t as unknown as { config?: Partial<BRConfig> }).config || {}) };
  const [phase, setPhase] = useState("qualif");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const nameOf = (id: string) => parts.find((p) => p.id === id)?.name || "—";

  const load = useCallback(async () => {
    if (!supabase) return;
    const r = await supabase.from("br_results").select("*").eq("tournament_id", t.id).order("round_no").order("lobby_no");
    setRes((r.data as BRResult[]) || []);
  }, [t.id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const has = (p: string) => res.some((r) => r.phase === p) || parts.some((pp) => pp.br_phase === p);
    setPhase(has("finale") ? "finale" : has("demi") ? "demi" : has("poules") ? "poules" : "qualif");
  }, [res, parts]);

  const active = parts.filter((p) => (p.br_phase || "qualif") === phase);
  const phaseRes = res.filter((r) => r.phase === phase);
  const roundNos = Array.from(new Set(phaseRes.map((r) => r.round_no))).sort((a, b) => a - b);
  const lastRound = roundNos.length ? Math.max(...roundNos) : 0;
  const lastRows = phaseRes.filter((r) => r.round_no === lastRound);
  const lastComplete = lastRound > 0 && lastRows.every((r) => r.placement != null);
  const rows = standings(res, phase, active);

  async function saveConfig(patch: Partial<BRConfig>) { if (!supabase) return; await supabase.from("tournaments").update({ config: { ...cfg, ...patch } }).eq("id", t.id); reload(); }

  async function genRound() {
    if (!supabase) return;
    if (active.length < 2) { alert("Pas assez de participants dans cette phase."); return; }
    const next = lastRound + 1;
    let lobbies: string[][];
    if (phase === "qualif") {
      const sizes = lobbySizes(active.length);
      const order = next === 1 ? [...active].sort((a, b) => a.seed - b.seed).map((p) => p.id) : rows.map((r) => r.id);
      lobbies = distribute(order, sizes, next === 1 ? "serp" : "blocks"); // M1 serpentin, M2+ par niveau
    } else if (next === 1) {
      const gs = Array.from(new Set(active.map((p) => p.group_no ?? 0))).sort((a, b) => a - b);
      lobbies = gs.map((g) => active.filter((p) => (p.group_no ?? 0) === g).sort((a, b) => a.seed - b.seed).map((p) => p.id));
    } else {
      const r1 = phaseRes.filter((r) => r.round_no === 1);
      const k = Math.max(...r1.map((r) => r.lobby_no)) + 1;
      lobbies = Array.from({ length: k }, (_, li) => r1.filter((r) => r.lobby_no === li).map((r) => r.participant_id));
    }
    const insert = lobbies.flatMap((lob, li) => lob.map((pid) => ({ tournament_id: t.id, phase, round_no: next, lobby_no: li, participant_id: pid, placement: null, points: null })));
    await supabase.from("br_results").insert(insert);
    await supabase.from("tournaments").update({ status: "running" }).eq("id", t.id);
    setDraft({}); load();
  }

  async function saveLobby(lobbyNo: number, size: number) {
    if (!supabase) return;
    const inLob = lastRows.filter((r) => r.lobby_no === lobbyNo);
    const pls = inLob.map((r) => parseInt(draft[r.participant_id] || ""));
    if (pls.some((p) => !p || p < 1 || p > size) || new Set(pls).size !== pls.length) { alert(`Donne une place unique (1 à ${size}) à chaque duo.`); return; }
    for (const r of inLob) { const pl = parseInt(draft[r.participant_id]); await supabase.from("br_results").update({ placement: pl, points: brPoints(size, pl) }).eq("id", r.id); }
    load();
  }

  async function setPhaseFor(ids: string[], toPhase: string, groupOf: (id: string) => number) {
    if (!supabase) return;
    let rank = 1;
    for (const id of ids) { await supabase.from("tournament_participants").update({ br_phase: toPhase, group_no: groupOf(id), seed: rank++ }).eq("id", id); }
    for (const p of active) if (!ids.includes(p.id)) await supabase.from("tournament_participants").update({ br_phase: "out" }).eq("id", p.id);
    reload(); load(); setPhase(toPhase);
  }

  // Suisse → Poules : top N en serpentin dans 4 poules
  async function toPoules() {
    const top = rows.slice(0, Math.min(cfg.qualify_poules, active.length)).map((r) => r.id);
    const nP = Math.min(4, Math.max(1, Math.floor(top.length / 2)));
    const poules = distribute(top, sizesFor(top.length, nP), "serp");
    const group: Record<string, number> = {}; poules.forEach((p, i) => p.forEach((id) => (group[id] = i)));
    await setPhaseFor(top, "poules", (id) => group[id]);
  }
  // Poules → Demies : top 2 de chaque poule, croisement 1A·1D·2B·2C / 1B·1C·2A·2D
  async function toDemi() {
    const poulesNos = Array.from(new Set(active.map((p) => p.group_no ?? 0))).sort((a, b) => a - b);
    const first: string[] = [], second: string[] = [];
    for (const g of poulesNos) { const st = lobbyStandings(res, "poules", active, g); if (st[0]) first.push(st[0].id); if (st[1]) second.push(st[1].id); }
    let demi1: string[], demi2: string[];
    if (poulesNos.length === 4) { // A0 B1 C2 D3
      demi1 = [first[0], first[3], second[1], second[2]].filter(Boolean);
      demi2 = [first[1], first[2], second[0], second[3]].filter(Boolean);
    } else { const all = [...first, ...second]; const h = Math.ceil(all.length / 2); demi1 = all.slice(0, h); demi2 = all.slice(h); }
    const group: Record<string, number> = {}; demi1.forEach((id) => (group[id] = 0)); demi2.forEach((id) => (group[id] = 1));
    await setPhaseFor([...demi1, ...demi2], "demi", (id) => group[id]);
  }
  // Demies → Finale : top 2 de chaque demie + meilleur 3e
  async function toFinale() {
    const d0 = lobbyStandings(res, "demi", active, 0), d1 = lobbyStandings(res, "demi", active, 1);
    const qualifs = [...d0.slice(0, 2), ...d1.slice(0, 2)].map((r) => r.id);
    const thirds = [d0[2], d1[2]].filter(Boolean).sort((a, b) => b!.pts - a!.pts || b!.top1 - a!.top1);
    if (thirds[0]) qualifs.push(thirds[0]!.id);
    await setPhaseFor(qualifs, "finale", () => 0);
  }

  const champId = phase === "finale" ? finaleChampion(res, active.map((p) => p.id), cfg.match_point) : null;
  useEffect(() => { if (champId && supabase) supabase.from("tournaments").update({ status: "done" }).eq("id", t.id); }, [champId, t.id]);
  const lobbiesInLast = Array.from(new Set(lastRows.map((r) => r.lobby_no))).sort((a, b) => a - b);
  const qualMark = phase === "qualif" ? cfg.qualify_poules : phase === "poules" ? 2 : phase === "demi" ? 2 : 1;

  return (
    <div>
      <div className="bu-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Réglages</h3>
        <div className="br-cfg">
          <label>Taille max salon<input type="number" min={2} max={5} value={cfg.lobby_size} onChange={(e) => saveConfig({ lobby_size: +e.target.value })} /></label>
          <label>Qualifiés en poules<input type="number" min={2} value={cfg.qualify_poules} onChange={(e) => saveConfig({ qualify_poules: +e.target.value })} /></label>
          <label>Match Point (pts)<input type="number" min={1} value={cfg.match_point} onChange={(e) => saveConfig({ match_point: +e.target.value })} /></label>
        </div>
        <p className="bu-muted" style={{ fontSize: ".8rem", margin: ".5rem 0 0" }}>Barème auto selon la taille du salon — 5 : 10/7/5/3/1 · 4 : 10/7/4/2. Suisse recommandée en 5 manches ; poules et demies en 3.</p>
      </div>

      <div className="br-phasenav">{PHASES.map((p) => <span key={p.key} className={"br-phasetab" + (p.key === phase ? " on" : "")}>{p.label}</span>)}</div>
      {champId && <div className="tlive-champ" style={{ margin: "1rem 0" }}>🏆 Vainqueur : <strong>{nameOf(champId)}</strong></div>}

      <div className="bu-card">
        <div className="bu-head" style={{ marginBottom: ".8rem" }}>
          <h3 style={{ margin: 0 }}>{phaseLabel(phase)} — {active.length} participants</h3>
          <span className="bu-crumb">{roundNos.length} manche{roundNos.length > 1 ? "s" : ""} jouée{roundNos.length > 1 ? "s" : ""}</span>
        </div>
        {(lastRound === 0 || lastComplete) && !champId && <button className="bu-btn" onClick={genRound}>+ Générer la manche {lastRound + 1}</button>}
        {lastRound > 0 && (
          <div className="br-lobbies">
            {lobbiesInLast.map((lb) => {
              const inLob = lastRows.filter((r) => r.lobby_no === lb).sort((a, b) => (a.placement || 99) - (b.placement || 99));
              const size = inLob.length; const done = inLob.every((r) => r.placement != null);
              const salonName = phase === "poules" ? `Poule ${String.fromCharCode(65 + lb)}` : phase === "demi" ? `Demi ${lb + 1}` : phase === "finale" ? "Finale" : `Salon ${lb + 1}`;
              return (
                <div className="br-lobby" key={lb}>
                  <div className="br-lobby-h">{salonName} <span className="bu-muted">· manche {lastRound}</span></div>
                  {inLob.map((r) => (
                    <div className="br-lobrow" key={r.id}>
                      <span className="br-lobnm">{nameOf(r.participant_id)}</span>
                      {done ? <span className="br-lobpl">{r.placement}ᵉ · {r.points} pts</span> : <input className="br-plin" type="number" min={1} max={size} placeholder="place" value={draft[r.participant_id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [r.participant_id]: e.target.value }))} />}
                    </div>
                  ))}
                  {!done && <button className="bu-btn bu-btn--sm" onClick={() => saveLobby(lb, size)}>Valider le salon</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {roundNos.length > 0 && (
        <div className="bu-card" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Classement — {phaseLabel(phase)}</h3>
          {phase === "poules" || phase === "demi" ? (
            Array.from(new Set(active.map((p) => p.group_no ?? 0))).sort((a, b) => a - b).map((g) => (
              <div key={g} style={{ marginBottom: "1rem" }}>
                <h4 className="brk-h4">{phase === "poules" ? `Poule ${String.fromCharCode(65 + g)}` : `Demi ${g + 1}`}</h4>
                <BRStand rows={lobbyStandings(res, phase, active, g)} nameOf={nameOf} qual={2} />
              </div>
            ))
          ) : <BRStand rows={rows} nameOf={nameOf} qual={qualMark} />}
          {lastComplete && phase === "qualif" && <button className="bu-btn" onClick={toPoules}>Clôturer la suisse → Poules (top {cfg.qualify_poules})</button>}
          {lastComplete && phase === "poules" && <button className="bu-btn" onClick={toDemi}>Clôturer les poules → Demi-finales (top 2 par poule)</button>}
          {lastComplete && phase === "demi" && <button className="bu-btn" onClick={toFinale}>Clôturer les demies → Finale (top 2 + meilleur 3e)</button>}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PUBLIC — en direct
   ================================================================ */
export function BattleRoyaleLive({ t, parts, results }: { t: Tournament; parts: TParticipant[]; results: BRResult[] }) {
  const cfg: BRConfig = { ...BR_DEFAULT, ...((t as unknown as { config?: Partial<BRConfig> }).config || {}) };
  const nameOf = (id: string) => parts.find((p) => p.id === id)?.name || "—";
  const has = (p: string) => results.some((r) => r.phase === p) || parts.some((pp) => pp.br_phase === p);
  const phase = has("finale") ? "finale" : has("demi") ? "demi" : has("poules") ? "poules" : "qualif";
  const active = parts.filter((p) => (p.br_phase || "qualif") === phase);
  const phaseRes = results.filter((r) => r.phase === phase);
  const lastRound = phaseRes.length ? Math.max(...phaseRes.map((r) => r.round_no)) : 0;
  const lastRows = phaseRes.filter((r) => r.round_no === lastRound);
  const lobbies = Array.from(new Set(lastRows.map((r) => r.lobby_no))).sort((a, b) => a - b);
  const champId = phase === "finale" ? finaleChampion(results, active.map((p) => p.id), cfg.match_point) : null;
  const grouped = phase === "poules" || phase === "demi";
  const groupNos = Array.from(new Set(active.map((p) => p.group_no ?? 0))).sort((a, b) => a - b);

  return (
    <div>
      <div className="br-live-sub">{phaseLabel(phase)}{lastRound ? ` · Manche ${lastRound}` : ""}</div>
      {champId && <div className="tlive-champ" style={{ margin: "0 auto 1.2rem", display: "table" }}>🏆 Vainqueur : <strong>{nameOf(champId)}</strong></div>}
      <div className="br-live-grid">
        <div className="br-live-rank">
          <h3 className="brk-h4">Classement</h3>
          {grouped
            ? groupNos.map((g) => (<div key={g} style={{ marginBottom: "1rem" }}><div className="br-live-gh">{phase === "poules" ? `Poule ${String.fromCharCode(65 + g)}` : `Demi ${g + 1}`}</div><BRStand rows={lobbyStandings(results, phase, active, g)} nameOf={nameOf} qual={2} /></div>))
            : <BRStand rows={standings(results, phase, active)} nameOf={nameOf} qual={phase === "qualif" ? cfg.qualify_poules : 0} />}
        </div>
        {lastRound > 0 && (
          <div className="br-live-lob">
            <h3 className="brk-h4">Salons — manche {lastRound}</h3>
            <div className="br-lobbies">
              {lobbies.map((lb) => {
                const inLob = lastRows.filter((r) => r.lobby_no === lb).sort((a, b) => (a.placement || 99) - (b.placement || 99));
                const salonName = phase === "poules" ? `Poule ${String.fromCharCode(65 + lb)}` : phase === "demi" ? `Demi ${lb + 1}` : phase === "finale" ? "Finale" : `Salon ${lb + 1}`;
                return (
                  <div className="br-lobby" key={lb}>
                    <div className="br-lobby-h">{salonName}</div>
                    {inLob.map((r) => (
                      <div className="br-lobrow" key={r.id}>
                        <span className="br-lobnm">{r.placement ? `${r.placement}ᵉ ` : ""}{nameOf(r.participant_id)}</span>
                        {r.points != null && <span className="br-lobpl">{r.points} pts</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
