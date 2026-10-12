"use client";
/* ================================================================
   BATTLE ROYALE / points par manche (type Brawl Stars, Fortnite…)
   Salons de N, points cumulés, re-mélange en serpentin, phases
   Qualifs → Demi-finales → Finale (Match Point).
   ================================================================ */
import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Tournament, TParticipant } from "./Tournois";

const supabase = getSupabase();

export const SCHEME: Record<number, number[]> = { 5: [10, 7, 5, 3, 1], 4: [10, 7, 4, 2], 3: [10, 7, 4], 2: [10, 7], 1: [10] };
export const brPoints = (size: number, placement: number) => (SCHEME[size] || [])[placement - 1] ?? 0;
export type BRConfig = { lobby_size: number; qualify_demi: number; finalists: number; match_point: number; finale_max: number };
export const BR_DEFAULT: BRConfig = { lobby_size: 5, qualify_demi: 10, finalists: 5, match_point: 20, finale_max: 6 };
export type BRResult = { id: string; tournament_id: string; phase: string; round_no: number; lobby_no: number; participant_id: string; placement: number | null; points: number | null };

const PHASES = [{ key: "qualif", label: "Qualifications" }, { key: "demi", label: "Demi-finales" }, { key: "finale", label: "Finale" }];
const phaseLabel = (p: string) => PHASES.find((x) => x.key === p)?.label || p;

function serpentine(ids: string[], k: number): string[][] {
  const lob: string[][] = Array.from({ length: k }, () => []);
  let dir = 1, i = 0;
  for (const id of ids) { lob[i].push(id); if (dir === 1) { if (i === k - 1) dir = -1; else i++; } else { if (i === 0) dir = 1; else i--; } }
  return lob;
}

type Row = { id: string; pts: number; top1: number; top2: number; pj: number };
function standings(res: BRResult[], phase: string, ids: string[]): Row[] {
  const map: Record<string, Row> = {};
  for (const id of ids) map[id] = { id, pts: 0, top1: 0, top2: 0, pj: 0 };
  for (const r of res) {
    if (r.phase !== phase || !map[r.participant_id] || r.placement == null) continue;
    const m = map[r.participant_id];
    m.pts += r.points || 0; m.pj++;
    if (r.placement === 1) m.top1++; if (r.placement === 2) m.top2++;
  }
  return Object.values(map).sort((a, b) => b.pts - a.pts || b.top1 - a.top1 || b.top2 - a.top2);
}
// Champion finale au Match Point : cumul avant la manche >= MP et Top 1 => vainqueur.
function finaleChampion(res: BRResult[], ids: string[], MP: number): string | null {
  const rounds = Array.from(new Set(res.filter((r) => r.phase === "finale").map((r) => r.round_no))).sort((a, b) => a - b);
  const tot: Record<string, number> = {}; ids.forEach((i) => (tot[i] = 0));
  for (const rn of rounds) {
    const rows = res.filter((r) => r.phase === "finale" && r.round_no === rn);
    if (rows.some((r) => r.placement == null)) break; // manche non terminée
    for (const r of rows) { if (tot[r.participant_id] >= MP && r.placement === 1) return r.participant_id; }
    for (const r of rows) tot[r.participant_id] += r.points || 0;
  }
  return null;
}

/* ---------- Tableau de classement ---------- */
function BRStand({ rows, nameOf, qual }: { rows: Row[]; nameOf: (id: string) => string; qual: number }) {
  return (
    <table className="brk-rank">
      <thead><tr><th>#</th><th>Duo / équipe</th><th>Pts</th><th>Top1</th><th>Top2</th><th>J</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id} className={i < qual ? "qual" : ""}>
            <td>{i + 1}</td><td className="nm">{nameOf(r.id)}</td><td><b>{r.pts}</b></td><td>{r.top1}</td><td>{r.top2}</td><td>{r.pj}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================
   BUREAU — gestion Battle Royale
   ================================================================ */
export function BattleRoyaleAdmin({ t, parts, reload }: { t: Tournament; parts: TParticipant[]; reload: () => void }) {
  const [res, setRes] = useState<BRResult[]>([]);
  const cfg: BRConfig = { ...BR_DEFAULT, ...((t as unknown as { config?: Partial<BRConfig> }).config || {}) };
  const [phase, setPhase] = useState("qualif");
  const [draft, setDraft] = useState<Record<string, string>>({}); // participant_id -> placement (saisie)
  const nameOf = (id: string) => parts.find((p) => p.id === id)?.name || "—";

  const load = useCallback(async () => {
    if (!supabase) return;
    const r = await supabase.from("br_results").select("*").eq("tournament_id", t.id).order("round_no").order("lobby_no");
    setRes((r.data as BRResult[]) || []);
  }, [t.id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { // phase courante = la plus avancée qui a des résultats ou des inscrits
    const has = (p: string) => res.some((r) => r.phase === p) || parts.some((pp) => pp.br_phase === p);
    setPhase(has("finale") ? "finale" : has("demi") ? "demi" : "qualif");
  }, [res, parts]);

  const active = parts.filter((p) => (p.br_phase || "qualif") === phase);
  const phaseRes = res.filter((r) => r.phase === phase);
  const roundNos = Array.from(new Set(phaseRes.map((r) => r.round_no))).sort((a, b) => a - b);
  const lastRound = roundNos.length ? Math.max(...roundNos) : 0;
  const lastRows = phaseRes.filter((r) => r.round_no === lastRound);
  const lastComplete = lastRound > 0 && lastRows.every((r) => r.placement != null);
  const rows = standings(res, phase, active.map((p) => p.id));

  async function saveConfig(patch: Partial<BRConfig>) {
    if (!supabase) return;
    await supabase.from("tournaments").update({ config: { ...cfg, ...patch } }).eq("id", t.id);
    reload();
  }

  async function genRound() {
    if (!supabase) return;
    if (active.length < 2) { alert("Pas assez de participants dans cette phase."); return; }
    const next = lastRound + 1;
    let lobbies: string[][];
    if (phase === "qualif") {
      const order = next === 1
        ? [...active].sort((a, b) => a.seed - b.seed).map((p) => p.id)
        : rows.map((r) => r.id);
      lobbies = serpentine(order, Math.max(1, Math.ceil(active.length / cfg.lobby_size)));
    } else {
      if (next === 1) {
        const order = [...active].sort((a, b) => a.seed - b.seed).map((p) => p.id);
        lobbies = serpentine(order, phase === "finale" ? 1 : Math.max(1, Math.ceil(active.length / cfg.lobby_size)));
      } else { // réutilise les salons de la manche 1 (salons figés en demi/finale)
        const r1 = phaseRes.filter((r) => r.round_no === 1);
        const k = Math.max(...r1.map((r) => r.lobby_no)) + 1;
        lobbies = Array.from({ length: k }, (_, li) => r1.filter((r) => r.lobby_no === li).map((r) => r.participant_id));
      }
    }
    const insert = lobbies.flatMap((lob, li) => lob.map((pid) => ({ tournament_id: t.id, phase, round_no: next, lobby_no: li, participant_id: pid, placement: null, points: null })));
    await supabase.from("br_results").insert(insert);
    await supabase.from("tournaments").update({ status: "running" }).eq("id", t.id);
    setDraft({}); load();
  }

  async function saveLobby(lobbyNo: number, size: number) {
    if (!supabase) return;
    const inLob = lastRows.filter((r) => r.lobby_no === lobbyNo);
    const placements = inLob.map((r) => parseInt(draft[r.participant_id] || ""));
    if (placements.some((p) => !p || p < 1 || p > size) || new Set(placements).size !== placements.length) {
      alert(`Donne une place unique (1 à ${size}) à chaque duo du salon.`); return;
    }
    for (const r of inLob) {
      const pl = parseInt(draft[r.participant_id]);
      await supabase.from("br_results").update({ placement: pl, points: brPoints(size, pl) }).eq("id", r.id);
    }
    load();
  }

  async function qualify(toPhase: string, n: number, perLobbyTop2 = false) {
    if (!supabase) return;
    let qualifiers: string[];
    if (perLobbyTop2) {
      // top 2 de chaque salon + meilleurs suivants jusqu'à n
      const lobbies = Array.from(new Set(phaseRes.map((r) => r.lobby_no)));
      const picked = new Set<string>();
      for (const lb of lobbies) {
        const ids = Array.from(new Set(phaseRes.filter((r) => r.lobby_no === lb).map((r) => r.participant_id)));
        const st = standings(res, phase, ids);
        st.slice(0, 2).forEach((r) => picked.add(r.id));
      }
      const rest = rows.filter((r) => !picked.has(r.id));
      for (const r of rest) { if (picked.size >= n) break; picked.add(r.id); }
      qualifiers = rows.filter((r) => picked.has(r.id)).map((r) => r.id);
    } else {
      qualifiers = rows.slice(0, n).map((r) => r.id);
    }
    // seed = rang dans la phase courante (sert au serpentin de la phase suivante)
    let rank = 1;
    for (const id of qualifiers) { await supabase.from("tournament_participants").update({ br_phase: toPhase, seed: rank++ }).eq("id", id); }
    for (const p of active) if (!qualifiers.includes(p.id)) await supabase.from("tournament_participants").update({ br_phase: "out" }).eq("id", p.id);
    reload(); load(); setPhase(toPhase);
  }

  const champId = phase === "finale" ? finaleChampion(res, active.map((p) => p.id), cfg.match_point) : null;
  useEffect(() => { if (champId && supabase) supabase.from("tournaments").update({ status: "done" }).eq("id", t.id); }, [champId, t.id]);

  const lobbiesInLast = Array.from(new Set(lastRows.map((r) => r.lobby_no))).sort((a, b) => a - b);

  return (
    <div>
      {/* Réglages */}
      <div className="bu-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Réglages</h3>
        <div className="br-cfg">
          <label>Taille des salons<input type="number" min={2} max={5} value={cfg.lobby_size} onChange={(e) => saveConfig({ lobby_size: +e.target.value })} /></label>
          <label>Qualifiés en demie<input type="number" min={2} value={cfg.qualify_demi} onChange={(e) => saveConfig({ qualify_demi: +e.target.value })} /></label>
          <label>Finalistes<input type="number" min={2} value={cfg.finalists} onChange={(e) => saveConfig({ finalists: +e.target.value })} /></label>
          <label>Match Point (pts)<input type="number" min={1} value={cfg.match_point} onChange={(e) => saveConfig({ match_point: +e.target.value })} /></label>
        </div>
        <p className="bu-muted" style={{ fontSize: ".8rem", margin: ".5rem 0 0" }}>Barème (auto selon la taille du salon) — 5 duos : 10/7/5/3/1 · 4 duos : 10/7/4/2.</p>
      </div>

      {/* Navigation de phase */}
      <div className="br-phasenav">
        {PHASES.map((p) => <span key={p.key} className={"br-phasetab" + (p.key === phase ? " on" : "")}>{p.label}</span>)}
      </div>

      {champId && <div className="tlive-champ" style={{ margin: "1rem 0" }}>🏆 Vainqueur : <strong>{nameOf(champId)}</strong></div>}

      {/* Manche courante */}
      <div className="bu-card">
        <div className="bu-head" style={{ marginBottom: ".8rem" }}>
          <h3 style={{ margin: 0 }}>{phaseLabel(phase)} — {active.length} participants</h3>
          <span className="bu-crumb">{roundNos.length} manche{roundNos.length > 1 ? "s" : ""} jouée{roundNos.length > 1 ? "s" : ""}</span>
        </div>
        {(lastRound === 0 || lastComplete) && !champId && (
          <button className="bu-btn" onClick={genRound}>+ Générer la manche {lastRound + 1}</button>
        )}
        {lastRound > 0 && (
          <div className="br-lobbies">
            {lobbiesInLast.map((lb) => {
              const inLob = lastRows.filter((r) => r.lobby_no === lb).sort((a, b) => (a.placement || 99) - (b.placement || 99));
              const size = inLob.length;
              const done = inLob.every((r) => r.placement != null);
              return (
                <div className="br-lobby" key={lb}>
                  <div className="br-lobby-h">Salon {lb + 1} <span className="bu-muted">· manche {lastRound}</span></div>
                  {inLob.map((r) => (
                    <div className="br-lobrow" key={r.id}>
                      <span className="br-lobnm">{nameOf(r.participant_id)}</span>
                      {done ? <span className="br-lobpl">{r.placement}ᵉ · {r.points} pts</span> : (
                        <input className="br-plin" type="number" min={1} max={size} placeholder="place" value={draft[r.participant_id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [r.participant_id]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                  {!done && <button className="bu-btn bu-btn--sm" onClick={() => saveLobby(lb, size)}>Valider le salon</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Classement + qualification */}
      {roundNos.length > 0 && (
        <div className="bu-card" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Classement — {phaseLabel(phase)}</h3>
          <BRStand rows={rows} nameOf={nameOf} qual={phase === "qualif" ? cfg.qualify_demi : phase === "demi" ? cfg.finalists : 1} />
          {lastComplete && phase === "qualif" && (
            <button className="bu-btn" onClick={() => qualify("demi", cfg.qualify_demi)}>Clôturer les qualifs → Demi-finales (top {cfg.qualify_demi})</button>
          )}
          {lastComplete && phase === "demi" && (
            <button className="bu-btn" onClick={() => qualify("finale", cfg.finalists, true)}>Clôturer les demies → Finale (top 2 par salon + meilleurs)</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PUBLIC — Battle Royale en direct
   ================================================================ */
export function BattleRoyaleLive({ t, parts, results }: { t: Tournament; parts: TParticipant[]; results: BRResult[] }) {
  const cfg: BRConfig = { ...BR_DEFAULT, ...((t as unknown as { config?: Partial<BRConfig> }).config || {}) };
  const nameOf = (id: string) => parts.find((p) => p.id === id)?.name || "—";
  const has = (p: string) => results.some((r) => r.phase === p) || parts.some((pp) => pp.br_phase === p);
  const phase = has("finale") ? "finale" : has("demi") ? "demi" : "qualif";
  const active = parts.filter((p) => (p.br_phase || "qualif") === phase);
  const rows = standings(results, phase, active.map((p) => p.id));
  const phaseRes = results.filter((r) => r.phase === phase);
  const lastRound = phaseRes.length ? Math.max(...phaseRes.map((r) => r.round_no)) : 0;
  const lastRows = phaseRes.filter((r) => r.round_no === lastRound);
  const lobbies = Array.from(new Set(lastRows.map((r) => r.lobby_no))).sort((a, b) => a - b);
  const champId = phase === "finale" ? finaleChampion(results, active.map((p) => p.id), cfg.match_point) : null;

  return (
    <div>
      <div className="br-live-sub">{phaseLabel(phase)}{lastRound ? ` · Manche ${lastRound}` : ""}</div>
      {champId && <div className="tlive-champ" style={{ margin: "0 auto 1.2rem", display: "table" }}>🏆 Vainqueur : <strong>{nameOf(champId)}</strong></div>}
      <div className="br-live-grid">
        <div className="br-live-rank">
          <h3 className="brk-h4">Classement</h3>
          <BRStand rows={rows} nameOf={nameOf} qual={phase === "qualif" ? cfg.qualify_demi : phase === "demi" ? cfg.finalists : 0} />
        </div>
        {lastRound > 0 && (
          <div className="br-live-lob">
            <h3 className="brk-h4">Salons — manche {lastRound}</h3>
            <div className="br-lobbies">
              {lobbies.map((lb) => {
                const inLob = lastRows.filter((r) => r.lobby_no === lb).sort((a, b) => (a.placement || 99) - (b.placement || 99));
                return (
                  <div className="br-lobby" key={lb}>
                    <div className="br-lobby-h">Salon {lb + 1}</div>
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
