"use client";
/* ================================================================
   TOURNOIS — gestion (bureau) + arbre + vue publique en direct
   Élimination directe (single elim) avec byes automatiques.
   Format "freeplay" = simple liste d'inscrits, sans arbre.
   ================================================================ */
import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export type Tournament = {
  id: string;
  name: string;
  game: string | null;
  format: "single_elim" | "freeplay";
  team_mode: boolean;
  status: "draft" | "open" | "running" | "done";
  is_public: boolean;
  event_label: string | null;
  created_at?: string;
};
export type TParticipant = { id: string; tournament_id: string; name: string; seed: number };
export type TMatch = {
  id: string; tournament_id: string; round: number; slot: number;
  p1_id: string | null; p2_id: string | null; winner_id: string | null;
  score: string | null; status: "pending" | "live" | "done";
};

/* ---------- Génération d'arbre (élimination directe) ------------- */
// Ordre de placement standard des têtes de série (répartit les byes).
function seedSlots(size: number): number[] {
  let seeds = [1, 2];
  const rounds = Math.log2(size);
  for (let r = 1; r < rounds; r++) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) { next.push(s); next.push(sum - s); }
    seeds = next;
  }
  return seeds;
}
function bracketSize(n: number): number { let s = 2; while (s < n) s *= 2; return s; }

type NewMatch = Omit<TMatch, "id">;
function buildBracketRows(tournamentId: string, participants: TParticipant[]): NewMatch[] {
  const n = participants.length;
  const size = bracketSize(n);
  const rounds = Math.log2(size);
  const order = seedSlots(size); // slot i -> seed (1-based)
  const atSlot = (slotPos: number): string | null => {
    const seed = order[slotPos];
    const p = participants[seed - 1];
    return p ? p.id : null;
  };
  const rows: NewMatch[] = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / Math.pow(2, r);
    for (let s = 0; s < count; s++) {
      const row: NewMatch = { tournament_id: tournamentId, round: r, slot: s, p1_id: null, p2_id: null, winner_id: null, score: null, status: "pending" };
      if (r === 1) { row.p1_id = atSlot(2 * s); row.p2_id = atSlot(2 * s + 1); }
      rows.push(row);
    }
  }
  return rows;
}

/* ---------- Résultat : fixe le vainqueur + fait avancer ---------- */
async function applyResult(match: TMatch, winnerId: string, score: string | null, all: TMatch[]) {
  if (!supabase) return;
  await supabase.from("tournament_matches").update({ winner_id: winnerId, score, status: "done" }).eq("id", match.id);
  const parent = all.find((m) => m.round === match.round + 1 && m.slot === Math.floor(match.slot / 2));
  if (parent) {
    const field = match.slot % 2 === 0 ? "p1_id" : "p2_id";
    await supabase.from("tournament_matches").update({ [field]: winnerId }).eq("id", parent.id);
  }
}

const roundName = (round: number, totalRounds: number): string => {
  const fromEnd = totalRounds - round; // 0 = finale
  if (fromEnd === 0) return "Finale";
  if (fromEnd === 1) return "Demi-finales";
  if (fromEnd === 2) return "Quarts de finale";
  if (fromEnd === 3) return "8es de finale";
  if (fromEnd === 4) return "16es de finale";
  return `Tour ${round}`;
};

/* ================================================================
   ARBRE — affichage partagé (bureau = éditable, public = lecture)
   ================================================================ */
export function Bracket({ matches, participants, editable, onResult }: {
  matches: TMatch[]; participants: TParticipant[]; editable: boolean;
  onResult?: (m: TMatch, winnerId: string, score: string) => void;
}) {
  const nameOf = (id: string | null) => (id ? participants.find((p) => p.id === id)?.name || "—" : null);
  const rounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0;
  const [editing, setEditing] = useState<string | null>(null);
  const [score, setScore] = useState("");

  if (!matches.length) return <p className="bu-muted">Arbre pas encore généré.</p>;

  return (
    <div className="brk">
      {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
        const col = matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot);
        return (
          <div className="brk-round" key={r}>
            <div className="brk-round-h">{roundName(r, rounds)}</div>
            {col.map((m) => {
              const p1 = nameOf(m.p1_id), p2 = nameOf(m.p2_id);
              const ready = !!m.p1_id && !!m.p2_id && m.status !== "done";
              const isEd = editing === m.id;
              return (
                <div className={"brk-match" + (m.status === "done" ? " done" : "")} key={m.id}>
                  <div className={"brk-team" + (m.winner_id === m.p1_id && m.p1_id ? " win" : "")}>
                    <span className="brk-nm">{p1 || <em>à venir</em>}</span>
                    {editable && ready && <button className="brk-pick" onClick={() => onResult?.(m, m.p1_id!, score)} title="Vainqueur">▲</button>}
                  </div>
                  <div className={"brk-team" + (m.winner_id === m.p2_id && m.p2_id ? " win" : "")}>
                    <span className="brk-nm">{p2 || <em>à venir</em>}</span>
                    {editable && ready && <button className="brk-pick" onClick={() => onResult?.(m, m.p2_id!, score)} title="Vainqueur">▲</button>}
                  </div>
                  {m.score ? <div className="brk-sc">{m.score}</div> : null}
                  {editable && ready && (
                    isEd ? (
                      <div className="brk-ed">
                        <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="score ex 2-1" />
                        <button className="bu-btn bu-btn--sm" onClick={() => setEditing(null)}>ok</button>
                      </div>
                    ) : (
                      <button className="brk-score-btn" onClick={() => { setEditing(m.id); setScore(m.score || ""); }}>+ score</button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   BUREAU — module de gestion des tournois
   ================================================================ */
export function TournoisModule() {
  const [list, setList] = useState<Tournament[]>([]);
  const [sel, setSel] = useState<Tournament | null>(null);
  const [parts, setParts] = useState<TParticipant[]>([]);
  const [matches, setMatches] = useState<TMatch[]>([]);
  const [err, setErr] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGame, setNewGame] = useState("");
  const [newTeam, setNewTeam] = useState("solo");
  const [newFormat, setNewFormat] = useState<"single_elim" | "freeplay">("single_elim");
  const [pName, setPName] = useState("");
  const [copied, setCopied] = useState(false);

  const loadList = useCallback(async () => {
    if (!supabase) return;
    const r = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
    if (r.error) { setErr(true); return; }
    setErr(false);
    setList((r.data as Tournament[]) || []);
  }, []);

  const loadOne = useCallback(async (id: string) => {
    if (!supabase) return;
    const [p, m] = await Promise.all([
      supabase.from("tournament_participants").select("*").eq("tournament_id", id).order("seed"),
      supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("round").order("slot"),
    ]);
    setParts((p.data as TParticipant[]) || []);
    setMatches((m.data as TMatch[]) || []);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (sel) loadOne(sel.id); }, [sel, loadOne]);

  async function createTournament() {
    if (!supabase || !newName.trim()) return;
    const { data, error } = await supabase.from("tournaments").insert({
      name: newName.trim(), game: newGame.trim() || null, team_mode: newTeam === "team",
      format: newFormat, status: "open", is_public: true,
    }).select().single();
    if (error) { alert("Création impossible : " + error.message); return; }
    setNewName(""); setNewGame("");
    await loadList();
    setSel(data as Tournament);
  }

  async function addParticipant() {
    if (!supabase || !sel || !pName.trim()) return;
    const seed = (parts.length ? Math.max(...parts.map((p) => p.seed)) : 0) + 1;
    await supabase.from("tournament_participants").insert({ tournament_id: sel.id, name: pName.trim(), seed });
    setPName("");
    loadOne(sel.id);
  }
  async function removeParticipant(id: string) {
    if (!supabase || !sel) return;
    await supabase.from("tournament_participants").delete().eq("id", id);
    loadOne(sel.id);
  }

  async function generateBracket() {
    if (!supabase || !sel) return;
    if (parts.length < 2) { alert("Il faut au moins 2 participants."); return; }
    if (matches.length && !confirm("Regénérer l'arbre ? Les scores actuels seront effacés.")) return;
    await supabase.from("tournament_matches").delete().eq("tournament_id", sel.id);
    const rows = buildBracketRows(sel.id, parts);
    await supabase.from("tournament_matches").insert(rows);
    await supabase.from("tournaments").update({ status: "running" }).eq("id", sel.id);
    // relire pour récupérer les ids, puis résoudre les byes (matchs à un seul joueur)
    const { data } = await supabase.from("tournament_matches").select("*").eq("tournament_id", sel.id).order("round").order("slot");
    const all = (data as TMatch[]) || [];
    for (const m of all.filter((x) => x.round === 1)) {
      const only = m.p1_id && !m.p2_id ? m.p1_id : (!m.p1_id && m.p2_id ? m.p2_id : null);
      if (only) await applyResult(m, only, "bye", all);
    }
    await loadList();
    loadOne(sel.id);
  }

  async function onResult(m: TMatch, winnerId: string, score: string) {
    await applyResult(m, winnerId, score || null, matches);
    if (sel) {
      // si la finale est jouée → tournoi terminé
      const rounds = Math.max(...matches.map((x) => x.round));
      if (m.round === rounds) await supabase?.from("tournaments").update({ status: "done" }).eq("id", sel.id);
      loadOne(sel.id);
      loadList();
    }
  }

  async function removeTournament(id: string) {
    if (!supabase || !confirm("Supprimer ce tournoi et tout son contenu ?")) return;
    await supabase.from("tournaments").delete().eq("id", id);
    setSel(null); loadList();
  }

  const publicUrl = sel ? `${typeof window !== "undefined" ? window.location.origin : ""}/tournoi/${sel.id}` : "";

  if (err) return <div className="bu-empty">Module non activé (tables « tournaments » absentes). Lance le SQL fourni dans Supabase.</div>;

  // ----- Détail d'un tournoi -----
  if (sel) {
    return (
      <div>
        <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => setSel(null)}>← Tous les tournois</button>
        <div className="bu-head" style={{ marginTop: ".8rem" }}>
          <h2 style={{ margin: 0 }}>{sel.name}</h2>
          <span className="bu-crumb">{sel.game || "—"} · {sel.team_mode ? "Équipes" : "Solo"} · {sel.format === "freeplay" ? "Free play" : "Élimination directe"}</span>
        </div>

        <div className="brk-toolbar">
          <a className="bu-btn bu-btn--sm" href={publicUrl} target="_blank" rel="noopener noreferrer">Ouvrir la vue publique ↗</a>
          <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => { navigator.clipboard?.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Lien copié ✓" : "Copier le lien public"}</button>
          <button className="bu-btn bu-btn--ghost bu-btn--sm" onClick={() => removeTournament(sel.id)} style={{ marginLeft: "auto", color: "#c96" }}>Supprimer</button>
        </div>

        {/* Participants */}
        <div className="bu-card" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Participants ({parts.length})</h3>
          <div className="brk-addp">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder={sel.team_mode ? "Nom de l'équipe" : "Pseudo du joueur"}
              onKeyDown={(e) => { if (e.key === "Enter") addParticipant(); }} />
            <button className="bu-btn bu-btn--sm" onClick={addParticipant}>+ Ajouter</button>
          </div>
          <div className="brk-plist">
            {parts.map((p, i) => (
              <span className="brk-pchip" key={p.id}><b>{i + 1}.</b> {p.name}<button onClick={() => removeParticipant(p.id)} title="Retirer">✕</button></span>
            ))}
            {parts.length === 0 && <span className="bu-muted">Ajoute les joueurs/équipes au fur et à mesure.</span>}
          </div>
          {sel.format === "single_elim" && (
            <button className="bu-btn" style={{ marginTop: ".8rem" }} onClick={generateBracket} disabled={parts.length < 2}>
              {matches.length ? "Regénérer l'arbre" : "Générer l'arbre"}
            </button>
          )}
        </div>

        {/* Arbre */}
        {sel.format === "single_elim" && (
          <div style={{ marginTop: "1.2rem" }}>
            <h3>Arbre du tournoi</h3>
            <Bracket matches={matches} participants={parts} editable onResult={onResult} />
            <p className="bu-muted" style={{ fontSize: ".82rem", marginTop: ".6rem" }}>Clique sur ▲ à côté du vainqueur de chaque match pour le faire avancer. « + score » pour noter le score.</p>
          </div>
        )}
      </div>
    );
  }

  // ----- Liste + création -----
  return (
    <div>
      <div className="bu-card">
        <h3 style={{ marginTop: 0 }}>Nouveau tournoi</h3>
        <div className="brk-create">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom (ex : Tournoi Valorant VGW)" />
          <input value={newGame} onChange={(e) => setNewGame(e.target.value)} placeholder="Jeu (ex : Valorant, FIFA…)" />
          <select value={newTeam} onChange={(e) => setNewTeam(e.target.value)}><option value="solo">Solo</option><option value="team">Équipes</option></select>
          <select value={newFormat} onChange={(e) => setNewFormat(e.target.value as "single_elim" | "freeplay")}>
            <option value="single_elim">Élimination directe</option>
            <option value="freeplay">Free play (sans arbre)</option>
          </select>
          <button className="bu-btn" onClick={createTournament} disabled={!newName.trim()}>Créer</button>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }} className="brk-tlist">
        {list.length === 0 ? <p className="bu-muted">Aucun tournoi pour l&apos;instant.</p> : list.map((t) => (
          <button className="bu-card brk-tcard" key={t.id} onClick={() => setSel(t)}>
            <div>
              <strong>{t.name}</strong>
              <div className="bu-muted" style={{ fontSize: ".84rem" }}>{t.game || "—"} · {t.team_mode ? "Équipes" : "Solo"} · {t.format === "freeplay" ? "Free play" : "Élim. directe"}</div>
            </div>
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
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setState("notfound"); return; }
    const tr = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (!tr.data) { setState("notfound"); return; }
    const [p, m] = await Promise.all([
      supabase.from("tournament_participants").select("*").eq("tournament_id", id).order("seed"),
      supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("round").order("slot"),
    ]);
    setT(tr.data as Tournament);
    setParts((p.data as TParticipant[]) || []);
    setMatches((m.data as TMatch[]) || []);
    setState("ok");
  }, [id]);

  useEffect(() => {
    load();
    timer.current = window.setInterval(load, 12000); // rafraîchissement auto
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [load]);

  if (state === "loading") return <div className="tlive"><p className="tlive-msg">Chargement…</p></div>;
  if (state === "notfound" || !t) return <div className="tlive"><p className="tlive-msg">Tournoi introuvable.</p></div>;

  const champ = (() => {
    if (!matches.length) return null;
    const rounds = Math.max(...matches.map((m) => m.round));
    const fin = matches.find((m) => m.round === rounds);
    return fin?.winner_id ? parts.find((p) => p.id === fin.winner_id)?.name : null;
  })();

  return (
    <div className="tlive">
      <header className="tlive-head">
        <div className="tlive-brand">EDEN<span>ESPORT</span></div>
        <h1>{t.name}</h1>
        <p>{t.game || ""}{t.game ? " · " : ""}{t.team_mode ? "Équipes" : "Solo"} · {parts.length} participants</p>
        {champ && <div className="tlive-champ">🏆 Vainqueur : <strong>{champ}</strong></div>}
      </header>
      {t.format === "freeplay" ? (
        <div className="tlive-list">
          {parts.map((p, i) => <div className="tlive-pp" key={p.id}><b>{i + 1}</b> {p.name}</div>)}
        </div>
      ) : (
        <Bracket matches={matches} participants={parts} editable={false} />
      )}
      <footer className="tlive-foot">Mise à jour automatique · edenesport.fr</footer>
    </div>
  );
}
