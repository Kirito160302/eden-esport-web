"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";

const supabase = getSupabase();

type Club = { id: string; name: string; sport?: string | null; invite_code?: string | null };
type Membership = { id: string; club_id: string; role: string; status: string; clubs?: Club | null };
type Team = { id: string; club_id: string; name: string; season?: string | null };
type Player = { id: string; club_id: string; team_id: string | null; first_name: string; last_name: string; birthdate?: string | null; licence_no?: string | null; status?: string | null; notes?: string | null };
type Member = { id: string; club_id: string; user_id: string; role: string; status: string };
type Guardian = { id: string; player_id: string; user_id: string };
type CEvent = { id: string; club_id: string; team_id: string | null; type: string; starts_at: string; place?: string | null; opponent?: string | null; notes?: string | null };
type Attend = { id: string; event_id: string; player_id: string; status: string };

const ROLE_LABEL: Record<string, string> = { dirigeant: "Dirigeant", educateur: "Éducateur", joueur: "Joueur", parent: "Parent" };
const EVENT_TYPES: [string, string][] = [["match", "Match"], ["entrainement", "Entraînement"], ["plateau", "Plateau"]];
const eventLabel = (t: string) => EVENT_TYPES.find(([k]) => k === t)?.[1] || t;
const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const DOC_CATS = ["Licence", "Certificat médical", "Autorisation", "Autre"];
type CDoc = { id: string; club_id: string; team_id: string | null; player_id: string; category?: string | null; file?: string | null; name?: string | null };
type CMsg = { id: string; team_id: string; sender: string; body: string; created_at: string };

async function uploadClubFile(clubId: string, playerId: string, file: File): Promise<{ path: string; name: string } | null> {
  if (!supabase) return null;
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${clubId}/${playerId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("club").upload(path, file, { upsert: false });
  if (error) { alert("Envoi du fichier impossible : " + error.message); return null; }
  return { path, name: file.name };
}
async function openClubFile(path?: string | null) {
  if (!supabase || !path) return;
  const { data, error } = await supabase.storage.from("club").createSignedUrl(path, 120);
  if (error || !data) { alert("Fichier introuvable."); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}

/* ================================================================
   CONNEXION / INSCRIPTION
   ================================================================ */
function AuthClub() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error" | "ok">("idle"); const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return; setState("sending"); setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setState("error"); setMsg(/invalid/i.test(error.message) ? "E-mail ou mot de passe incorrect." : "Connexion impossible."); }
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { pseudo: name.trim() } } });
      if (error) { setState("error"); setMsg(error.message); return; }
      if (!data.session) { setState("ok"); setMsg("Compte créé. Si une confirmation par e-mail est demandée, valide-la puis connecte-toi."); }
    }
  }
  return (
    <div className="esp-card esp-center cl-auth">
      <h2>Espace club</h2>
      <p className="muted">Gestion des équipes, convocations et présences.</p>
      <div className="esp-seg" style={{ margin: "1rem 0" }}>
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Connexion</button>
        <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>Créer un compte</button>
      </div>
      <form className="form" onSubmit={submit}>
        {mode === "signup" && <div className="esp-field"><span>Nom complet</span><input className="esp-input" required value={name} onChange={(e) => setName(e.target.value)} /></div>}
        <div className="esp-field"><span>E-mail</span><input className="esp-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div className="esp-field"><span>Mot de passe</span><input className="esp-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
        {state === "error" && <div className="form-ok form-err show" role="alert">{msg}</div>}
        {state === "ok" && <div className="form-ok show" role="status">{msg}</div>}
        <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}<span className="arw">→</span></button>
      </form>
    </div>
  );
}

/* ================================================================
   AUCUN CLUB — rejoindre par code / créer un club
   ================================================================ */
function NoClub({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState(""); const [role, setRole] = useState("parent");
  const [cname, setCname] = useState(""); const [sport, setSport] = useState("Rugby");
  const [msg, setMsg] = useState("");
  async function join(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !code.trim()) return; setMsg("");
    const { error } = await supabase.rpc("join_club", { p_code: code.trim(), p_role: role });
    if (error) { setMsg(error.message); return; }
    onDone();
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !cname.trim()) return; setMsg("");
    const { error } = await supabase.rpc("create_club", { p_name: cname.trim(), p_sport: sport.trim() || null });
    if (error) { setMsg(error.message); return; }
    onDone();
  }
  return (
    <div className="cl-noclub">
      <div className="esp-card">
        <h3>Rejoindre un club</h3>
        <p className="muted" style={{ marginBottom: ".8rem" }}>Saisis le code d&apos;invitation fourni par ton club.</p>
        <form className="form" onSubmit={join}>
          <div className="esp-field"><span>Code du club</span><input className="esp-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex : 3F9A2C" /></div>
          <div className="esp-field"><span>Je suis</span>
            <select className="esp-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="parent">Parent</option><option value="educateur">Éducateur / coach</option><option value="joueur">Joueur</option>
            </select>
          </div>
          <button className="btn btn--sm" type="submit">Rejoindre</button>
        </form>
      </div>
      <div className="esp-card">
        <h3>Créer un club</h3>
        <p className="muted" style={{ marginBottom: ".8rem" }}>Tu deviens dirigeant et reçois un code d&apos;invitation à partager.</p>
        <form className="form" onSubmit={create}>
          <div className="esp-field"><span>Nom du club</span><input className="esp-input" value={cname} onChange={(e) => setCname(e.target.value)} placeholder="Rapid 33" /></div>
          <div className="esp-field"><span>Sport</span><input className="esp-input" value={sport} onChange={(e) => setSport(e.target.value)} /></div>
          <button className="btn btn--ghost btn--sm" type="submit">Créer le club</button>
        </form>
      </div>
      {msg && <p className="form-err show" style={{ gridColumn: "1/-1" }}>{msg}</p>}
    </div>
  );
}

/* ================================================================
   EFFECTIFS (catégories + joueurs)
   ================================================================ */
function Effectifs({ club, role, teams, players, members, staff, guardians, profiles, reload }: {
  club: Club; role: string; teams: Team[]; players: Player[]; members: Member[]; staff: { team_id: string; user_id: string }[];
  guardians: Guardian[]; profiles: Record<string, string>; reload: () => void;
}) {
  const isAdmin = role === "dirigeant";
  const [sel, setSel] = useState<string>(teams[0]?.id || "");
  const [newCat, setNewCat] = useState(""); const [newSeason, setNewSeason] = useState("");
  const [pf, setPf] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);

  const cat = teams.find((t) => t.id === sel) || teams[0];
  const catPlayers = players.filter((p) => p.team_id === (cat?.id || ""));
  const parentMembers = members.filter((m) => m.role === "parent" && m.status === "actif");

  async function addCat(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !newCat.trim()) return;
    await supabase.from("club_teams").insert({ club_id: club.id, name: newCat.trim(), season: newSeason.trim() || null });
    setNewCat(""); setNewSeason(""); reload();
  }
  async function delCat(id: string) { if (!supabase || !confirm("Supprimer cette catégorie ?")) return; await supabase.from("club_teams").delete().eq("id", id); reload(); }
  async function addPlayer(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !cat || !pf.last_name) return;
    await supabase.from("players").insert({ club_id: club.id, team_id: cat.id, first_name: pf.first_name || null, last_name: pf.last_name, birthdate: pf.birthdate || null, licence_no: pf.licence_no || null });
    setPf({}); setAddOpen(false); reload();
  }
  async function delPlayer(id: string) { if (!supabase || !confirm("Retirer ce joueur ?")) return; await supabase.from("players").delete().eq("id", id); reload(); }
  async function linkParent(playerId: string, userId: string) { if (!supabase || !userId) return; await supabase.from("guardians").insert({ player_id: playerId, user_id: userId }); reload(); }
  async function unlink(id: string) { if (!supabase) return; await supabase.from("guardians").delete().eq("id", id); reload(); }
  async function assignStaff(teamId: string, userId: string) { if (!supabase || !userId) return; await supabase.from("team_staff").insert({ team_id: teamId, user_id: userId }); reload(); }

  const eduMembers = members.filter((m) => m.role === "educateur" && m.status === "actif");
  const catStaff = staff.filter((s) => s.team_id === (cat?.id || ""));

  return (
    <div className="cl-eff">
      <aside className="cl-cats">
        <div className="cl-cats-h">Catégories</div>
        {teams.length === 0 && <p className="muted" style={{ fontSize: ".85rem", padding: ".3rem .5rem" }}>Aucune catégorie.</p>}
        {teams.map((t) => (
          <button key={t.id} className={"cl-cat" + (t.id === sel ? " on" : "")} onClick={() => setSel(t.id)}>
            {t.name}{t.season ? <em> · {t.season}</em> : null}
          </button>
        ))}
        {isAdmin && (
          <form className="cl-addcat" onSubmit={addCat}>
            <input className="esp-input" placeholder="Ex : U12" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <input className="esp-input" placeholder="Saison (opt.)" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} />
            <button className="btn btn--sm" type="submit">+ Catégorie</button>
          </form>
        )}
      </aside>

      <section className="cl-roster">
        {!cat ? <div className="esp-card esp-center"><p className="muted">Crée une catégorie pour commencer.</p></div> : (
          <>
            <div className="cl-roster-head">
              <div>
                <h3 style={{ margin: 0 }}>{cat.name}</h3>
                <span className="muted" style={{ fontSize: ".85rem" }}>{catPlayers.length} joueur(s){catStaff.length ? " · Éducateurs : " + catStaff.map((s) => profiles[s.user_id] || "—").join(", ") : ""}</span>
              </div>
              <div style={{ display: "flex", gap: ".4rem" }}>
                <button className="btn btn--sm" onClick={() => setAddOpen((v) => !v)}>{addOpen ? "Fermer" : "+ Joueur"}</button>
                {isAdmin && <button className="btn btn--ghost btn--sm" onClick={() => delCat(cat.id)}>Suppr. catégorie</button>}
              </div>
            </div>

            {isAdmin && eduMembers.length > 0 && (
              <div className="cl-assign">
                <span className="muted">Assigner un éducateur :</span>
                <select className="esp-input" defaultValue="" onChange={(e) => { assignStaff(cat.id, e.target.value); e.target.value = ""; }} style={{ maxWidth: 220 }}>
                  <option value="">Choisir…</option>
                  {eduMembers.filter((m) => !catStaff.some((s) => s.user_id === m.user_id)).map((m) => <option key={m.user_id} value={m.user_id}>{profiles[m.user_id] || "—"}</option>)}
                </select>
              </div>
            )}

            {addOpen && (
              <form className="esp-card cl-addplayer" onSubmit={addPlayer}>
                <div className="cl-addgrid">
                  <label className="esp-field"><span>Nom</span><input className="esp-input" required value={pf.last_name || ""} onChange={(e) => setPf({ ...pf, last_name: e.target.value })} /></label>
                  <label className="esp-field"><span>Prénom</span><input className="esp-input" value={pf.first_name || ""} onChange={(e) => setPf({ ...pf, first_name: e.target.value })} /></label>
                  <label className="esp-field"><span>Date de naissance</span><input className="esp-input" type="date" value={pf.birthdate || ""} onChange={(e) => setPf({ ...pf, birthdate: e.target.value })} /></label>
                  <label className="esp-field"><span>N° licence</span><input className="esp-input" value={pf.licence_no || ""} onChange={(e) => setPf({ ...pf, licence_no: e.target.value })} /></label>
                </div>
                <button className="btn btn--sm" type="submit">Enregistrer</button>
              </form>
            )}

            <div className="cl-players">
              {catPlayers.length === 0 ? <p className="muted">Aucun joueur dans cette catégorie.</p> :
                catPlayers.map((p) => {
                  const pg = guardians.filter((g) => g.player_id === p.id);
                  return (
                    <div key={p.id} className="esp-card cl-player">
                      <div className="cl-player-top">
                        <strong>{p.last_name} {p.first_name}</strong>
                        <span className="muted">{[p.birthdate ? new Date(p.birthdate).toLocaleDateString("fr-FR") : "", p.licence_no ? "Lic. " + p.licence_no : ""].filter(Boolean).join(" · ")}</span>
                        <button className="esp-del" onClick={() => delPlayer(p.id)}>✕</button>
                      </div>
                      <div className="cl-guardians">
                        <span className="muted">Parents :</span>
                        {pg.length === 0 ? <em className="muted">aucun</em> : pg.map((g) => (
                          <span key={g.id} className="cl-gchip">{profiles[g.user_id] || "—"}<button onClick={() => unlink(g.id)} aria-label="Retirer">✕</button></span>
                        ))}
                        {parentMembers.length > 0 && (
                          <select className="esp-input cl-gsel" defaultValue="" onChange={(e) => { linkParent(p.id, e.target.value); e.target.value = ""; }}>
                            <option value="">+ Rattacher un parent</option>
                            {parentMembers.filter((m) => !pg.some((g) => g.user_id === m.user_id)).map((m) => <option key={m.user_id} value={m.user_id}>{profiles[m.user_id] || "—"}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ================================================================
   MEMBRES & VALIDATION (dirigeant)
   ================================================================ */
function Membres({ club, members, profiles, reload }: { club: Club; members: Member[]; profiles: Record<string, string>; reload: () => void }) {
  async function setStatus(id: string, status: string) { if (!supabase) return; await supabase.from("club_members").update({ status }).eq("id", id); reload(); }
  async function setRole(id: string, role: string) { if (!supabase) return; await supabase.from("club_members").update({ role }).eq("id", id); reload(); }
  async function remove(id: string) { if (!supabase || !confirm("Retirer ce membre ?")) return; await supabase.from("club_members").delete().eq("id", id); reload(); }
  const pending = members.filter((m) => m.status === "en_attente");
  return (
    <div>
      <div className="esp-card cl-invite">
        <div><span className="muted">Code d&apos;invitation du club</span><div className="cl-code">{club.invite_code || "—"}</div></div>
        <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>Partage ce code : les éducateurs et parents créent leur compte puis rejoignent le club avec.</p>
      </div>
      {pending.length > 0 && <p className="cl-pendlab">{pending.length} demande(s) en attente de validation</p>}
      <div className="bu-tablewrap"><table className="bu-table">
        <thead><tr><th>Membre</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
        <tbody>{members.map((m) => (
          <tr key={m.id}>
            <td>{profiles[m.user_id] || "—"}</td>
            <td><select className="esp-input" value={m.role} onChange={(e) => setRole(m.id, e.target.value)} style={{ maxWidth: 150 }}>
              {["dirigeant", "educateur", "joueur", "parent"].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select></td>
            <td>{m.status === "actif" ? <span className="cl-badge ok">Actif</span> : <button className="btn btn--sm" onClick={() => setStatus(m.id, "actif")}>Valider</button>}</td>
            <td><button className="esp-del" onClick={() => remove(m.id)}>Retirer</button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

/* ================================================================
   VUE PARENT — mes enfants
   ================================================================ */
function MesEnfants({ players, teams }: { players: Player[]; teams: Team[] }) {
  if (players.length === 0) return <div className="esp-card esp-center"><p className="muted">Aucun enfant rattaché à ton compte pour l&apos;instant. Un éducateur du club va te rattacher à ton/tes enfant(s).</p></div>;
  return (
    <div className="cl-players">
      {players.map((p) => (
        <div key={p.id} className="esp-card cl-player">
          <strong>{p.last_name} {p.first_name}</strong>
          <span className="muted">{teams.find((t) => t.id === p.team_id)?.name || "Sans catégorie"}{p.licence_no ? " · Lic. " + p.licence_no : ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   CONVOCATIONS & PRÉSENCES
   ================================================================ */
function Convocations({ club, role, teams, players, events, attendance, meId, reload }: {
  club: Club; role: string; teams: Team[]; players: Player[]; events: CEvent[]; attendance: Attend[]; meId: string; reload: () => void;
}) {
  const isManager = role === "dirigeant" || role === "educateur";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ type: "match" });
  const [expanded, setExpanded] = useState<string | null>(null);

  const now = Date.now();
  const upcoming = [...events].filter((e) => new Date(e.starts_at).getTime() > now - 6 * 3600 * 1000).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const past = [...events].filter((e) => new Date(e.starts_at).getTime() <= now - 6 * 3600 * 1000).sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at)).slice(0, 8);
  const attKey = (eid: string, pid: string) => attendance.find((a) => a.event_id === eid && a.player_id === pid)?.status;

  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !f.team_id || !f.date) return;
    await supabase.from("club_events").insert({
      club_id: club.id, team_id: f.team_id, type: f.type || "match",
      starts_at: new Date(f.date).toISOString(), place: f.place || null, opponent: f.opponent || null, notes: f.notes || null,
    });
    setF({ type: "match" }); setOpen(false); reload();
  }
  async function delEvent(id: string) { if (!supabase || !confirm("Supprimer cet événement ?")) return; await supabase.from("club_events").delete().eq("id", id); reload(); }
  async function respond(eventId: string, playerId: string, status: string) {
    if (!supabase) return;
    await supabase.from("event_attendance").upsert({ event_id: eventId, player_id: playerId, status, responded_by: meId, updated_at: new Date().toISOString() }, { onConflict: "event_id,player_id" });
    reload();
  }

  const EventCard = ({ e, isPast }: { e: CEvent; isPast?: boolean }) => {
    const cat = teams.find((t) => t.id === e.team_id);
    const roster = players.filter((p) => p.team_id === e.team_id);
    const cnt = (s: string) => roster.filter((p) => attKey(e.id, p.id) === s).length;
    const isOpen = expanded === e.id;
    return (
      <div className="esp-card cl-event">
        <div className="cl-event-head" onClick={() => setExpanded(isOpen ? null : e.id)}>
          <span className={"cl-etype cl-etype-" + e.type}>{eventLabel(e.type)}</span>
          <div className="cl-event-main">
            <strong>{cat?.name || "—"}{e.opponent ? ` · vs ${e.opponent}` : ""}</strong>
            <span className="muted">{fmtDT(e.starts_at)}{e.place ? ` · ${e.place}` : ""}</span>
          </div>
          <div className="cl-event-cnt"><span className="ok">{cnt("present")}✓</span> <span className="no">{cnt("absent")}✗</span> {isManager ? <span className="wait">{roster.length - cnt("present") - cnt("absent") - cnt("peutetre")}?</span> : null}</div>
        </div>
        {isOpen && (
          <div className="cl-event-body">
            {e.notes ? <p className="muted" style={{ fontSize: ".85rem" }}>{e.notes}</p> : null}
            {roster.length === 0 ? <p className="muted">Aucun joueur dans cette catégorie.</p> : (
              <div className="cl-att-list">
                {roster.map((p) => {
                  const st = attKey(e.id, p.id);
                  return (
                    <div key={p.id} className="cl-att-row">
                      <span className="cl-att-name">{p.last_name} {p.first_name}</span>
                      <div className="cl-att-btns">
                        {(["present", "peutetre", "absent"] as const).map((s) => (
                          <button key={s} className={"cl-att-btn cl-att-" + s + (st === s ? " on" : "")} disabled={isPast && !isManager}
                            onClick={() => respond(e.id, p.id, s)}>{s === "present" ? "Présent" : s === "peutetre" ? "Peut-être" : "Absent"}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {isManager && <button className="esp-del" style={{ marginTop: ".6rem" }} onClick={() => delEvent(e.id)}>Supprimer l&apos;événement</button>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {isManager && (
        <div className="cl-conv-head">
          <button className="btn btn--sm" onClick={() => setOpen((v) => !v)} disabled={teams.length === 0}>{open ? "Fermer" : "+ Convoquer / événement"}</button>
          {teams.length === 0 && <span className="muted" style={{ fontSize: ".85rem" }}>Crée d&apos;abord une catégorie dans Effectifs.</span>}
        </div>
      )}
      {open && (
        <form className="esp-card cl-addplayer" onSubmit={create}>
          <div className="cl-addgrid">
            <label className="esp-field"><span>Catégorie</span><select className="esp-input" required value={f.team_id || ""} onChange={(e) => setF({ ...f, team_id: e.target.value })}><option value="">—</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="esp-field"><span>Type</span><select className="esp-input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{EVENT_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="esp-field"><span>Date & heure</span><input className="esp-input" type="datetime-local" required value={f.date || ""} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
            <label className="esp-field"><span>Lieu</span><input className="esp-input" value={f.place || ""} onChange={(e) => setF({ ...f, place: e.target.value })} /></label>
            <label className="esp-field"><span>Adversaire (match)</span><input className="esp-input" value={f.opponent || ""} onChange={(e) => setF({ ...f, opponent: e.target.value })} /></label>
          </div>
          <label className="esp-field"><span>Notes / convocation</span><textarea className="esp-input" value={f.notes || ""} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
          <button className="btn btn--sm" type="submit" style={{ marginTop: ".6rem" }}>Créer</button>
        </form>
      )}

      <p className="cl-sectlab">À venir</p>
      {upcoming.length === 0 ? <div className="esp-card esp-center"><p className="muted">Aucun événement à venir.</p></div> :
        <div className="cl-events">{upcoming.map((e) => <EventCard key={e.id} e={e} />)}</div>}
      {past.length > 0 && <><p className="cl-sectlab">Passés</p><div className="cl-events">{past.map((e) => <EventCard key={e.id} e={e} isPast />)}</div></>}
    </div>
  );
}

/* ================================================================
   DOCUMENTS (licences, certificats médicaux…)
   ================================================================ */
function Documents({ club, teams, players, docs, reload }: {
  club: Club; teams: Team[]; players: Player[]; docs: CDoc[]; reload: () => void;
}) {
  const [cat, setCat] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  async function upload(player: Player, file: File) {
    setBusy(player.id);
    const r = await uploadClubFile(club.id, player.id, file);
    if (r && supabase) await supabase.from("club_documents").insert({ club_id: club.id, team_id: player.team_id, player_id: player.id, category: cat[player.id] || "Autre", file: r.path, name: r.name });
    setBusy(""); reload();
  }
  async function del(d: CDoc) {
    if (!supabase || !confirm("Supprimer ce document ?")) return;
    if (d.file) await supabase.storage.from("club").remove([d.file]);
    await supabase.from("club_documents").delete().eq("id", d.id);
    reload();
  }
  if (players.length === 0) return <div className="esp-card esp-center"><p className="muted">Aucun joueur accessible.</p></div>;
  return (
    <div className="cl-players">
      {players.map((p) => {
        const pd = docs.filter((d) => d.player_id === p.id);
        return (
          <div key={p.id} className="esp-card cl-player">
            <div className="cl-player-top"><strong>{p.last_name} {p.first_name}</strong><span className="muted">{teams.find((t) => t.id === p.team_id)?.name || ""}</span></div>
            <div className="cl-docs">
              {pd.length === 0 ? <em className="muted" style={{ fontSize: ".85rem" }}>Aucun document.</em> :
                pd.map((d) => (
                  <span key={d.id} className="cl-doc">
                    <button className="cl-doc-open" onClick={() => openClubFile(d.file)}>📎 {d.category} — {d.name}</button>
                    <button className="cl-doc-del" onClick={() => del(d)} aria-label="Supprimer">✕</button>
                  </span>
                ))}
            </div>
            <div className="cl-doc-add">
              <select className="esp-input" value={cat[p.id] || "Licence"} onChange={(e) => setCat({ ...cat, [p.id]: e.target.value })} style={{ maxWidth: 180 }}>
                {DOC_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="btn btn--ghost btn--sm">{busy === p.id ? "Envoi…" : "📎 Ajouter"}
                <input type="file" hidden disabled={busy === p.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(p, file); e.target.value = ""; }} />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   MESSAGERIE PAR CATÉGORIE
   ================================================================ */
function ClubMessagerie({ channels, meId, profiles }: { channels: Team[]; meId: string; profiles: Record<string, string> }) {
  const [sel, setSel] = useState<string>(channels[0]?.id || "");
  const [msgs, setMsgs] = useState<CMsg[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chan = channels.find((c) => c.id === sel);

  useEffect(() => {
    if (!supabase || !sel) return;
    let live = true;
    (async () => { const r = await supabase!.from("club_messages").select("*").eq("team_id", sel).order("created_at").limit(500); if (live) setMsgs((r.data as CMsg[]) || []); })();
    const rt = supabase.channel("cmsg:" + sel).on("postgres_changes", { event: "INSERT", schema: "public", table: "club_messages", filter: `team_id=eq.${sel}` }, (payload) => {
      const m = payload.new as CMsg; setMsgs((p) => p.some((x) => x.id === m.id) ? p : [...p, m]);
    }).subscribe();
    return () => { live = false; supabase!.removeChannel(rt); };
  }, [sel]);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !sel || !text.trim()) return;
    const body = text.trim(); setText("");
    const { data } = await supabase.from("club_messages").insert({ team_id: sel, body }).select().single();
    if (data) { const m = data as CMsg; setMsgs((p) => p.some((x) => x.id === m.id) ? p : [...p, m]); }
  }
  if (channels.length === 0) return <div className="esp-card esp-center"><p className="muted">Aucune catégorie accessible pour la messagerie.</p></div>;
  return (
    <div className="cl-msgr">
      <aside className="cl-msgr-side">
        {channels.map((c) => <button key={c.id} className={"cl-msgr-chan" + (c.id === sel ? " on" : "")} onClick={() => setSel(c.id)}># {c.name}</button>)}
      </aside>
      <section className="cl-msgr-main">
        <div className="cl-msgr-title"># {chan?.name || ""}</div>
        <div className="cl-msgr-scroll" ref={scrollRef}>
          {msgs.length === 0 ? <p className="muted">Aucun message. Lance la discussion !</p> :
            msgs.map((m) => {
              const mine = m.sender === meId;
              return (
                <div key={m.id} className={"cl-msg" + (mine ? " mine" : "")}>
                  {!mine && <div className="cl-msg-who">{profiles[m.sender] || "—"}</div>}
                  <div className="cl-msg-bubble">{m.body}</div>
                  <div className="cl-msg-time">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              );
            })}
        </div>
        <form className="cl-msgr-input" onSubmit={send}>
          <input className="esp-input" placeholder="Écris un message…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn--sm" type="submit" disabled={!text.trim()}>Envoyer</button>
        </form>
      </section>
    </div>
  );
}

/* ================================================================
   ESPACE D'UN CLUB (membre actif)
   ================================================================ */
function ClubSpace({ membership, meId, onLeaveClub }: { membership: Membership; meId: string; onLeaveClub: () => void }) {
  const club = membership.clubs as Club;
  const role = membership.role;
  const isAdmin = role === "dirigeant";
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staff, setStaff] = useState<{ team_id: string; user_id: string }[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [events, setEvents] = useState<CEvent[]>([]);
  const [attendance, setAttendance] = useState<Attend[]>([]);
  const [docs, setDocs] = useState<CDoc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  const load = useCallback(async () => {
    if (!supabase) return; setLoading(true);
    const [t, p, m, ev, at] = await Promise.all([
      supabase.from("club_teams").select("*").eq("club_id", club.id).order("name"),
      supabase.from("players").select("*").eq("club_id", club.id),
      supabase.from("club_members").select("*").eq("club_id", club.id),
      supabase.from("club_events").select("*").eq("club_id", club.id),
      supabase.from("event_attendance").select("*"),
    ]);
    const tt = (t.data as Team[]) || []; setTeams(tt);
    setPlayers((p.data as Player[]) || []);
    const mm = (m.data as Member[]) || []; setMembers(mm);
    setEvents((ev.data as CEvent[]) || []);
    setAttendance((at.data as Attend[]) || []);
    const teamIds = tt.map((x) => x.id);
    const [st, gu, pr, dc] = await Promise.all([
      teamIds.length ? supabase.from("team_staff").select("*").in("team_id", teamIds) : Promise.resolve({ data: [] }),
      supabase.from("guardians").select("*"),
      supabase.from("profiles").select("id,pseudo"),
      supabase.from("club_documents").select("*").eq("club_id", club.id),
    ]);
    setStaff((st.data as { team_id: string; user_id: string }[]) || []);
    setGuardians((gu.data as Guardian[]) || []);
    setDocs((dc.data as CDoc[]) || []);
    const pm: Record<string, string> = {};
    for (const x of (pr.data as { id: string; pseudo: string }[]) || []) pm[x.id] = x.pseudo || "—";
    setProfiles(pm);
    setLoading(false);
  }, [club.id]);
  useEffect(() => { load(); }, [load]);

  const TABS = isAdmin ? [["dashboard", "Tableau de bord"], ["effectifs", "Effectifs"], ["convocations", "Convocations"], ["messagerie", "Messagerie"], ["documents", "Documents"], ["membres", "Membres"]]
    : role === "educateur" ? [["dashboard", "Tableau de bord"], ["effectifs", "Effectifs"], ["convocations", "Convocations"], ["messagerie", "Messagerie"], ["documents", "Documents"]]
      : role === "parent" ? [["dashboard", "Tableau de bord"], ["convocations", "Convocations"], ["messagerie", "Messagerie"], ["documents", "Documents"], ["enfants", "Mes enfants"]]
        : [["dashboard", "Tableau de bord"]];
  const channels = isAdmin ? teams
    : role === "educateur" ? teams.filter((t) => staff.some((s) => s.team_id === t.id && s.user_id === meId))
      : role === "parent" ? teams.filter((t) => players.some((p) => p.team_id === t.id))
        : [];

  return (
    <>
      <div className="esp-seg esp-tabs" style={{ marginTop: "1rem" }}>
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {loading ? <p className="muted">Chargement…</p> : (
        <>
          {tab === "dashboard" && (
            <div className="cl-kpis">
              <div className="esp-card cl-kpi"><span className="cl-kpi-v">{teams.length}</span><span className="muted">Catégories</span></div>
              <div className="esp-card cl-kpi"><span className="cl-kpi-v">{players.length}</span><span className="muted">{role === "parent" ? "Mes enfants" : "Joueurs"}</span></div>
              {isAdmin && <div className="esp-card cl-kpi"><span className="cl-kpi-v">{members.filter((m) => m.status === "actif").length}</span><span className="muted">Membres actifs</span></div>}
              {isAdmin && members.some((m) => m.status === "en_attente") && <div className="esp-card cl-kpi"><span className="cl-kpi-v" style={{ color: "#f6c95c" }}>{members.filter((m) => m.status === "en_attente").length}</span><span className="muted">À valider</span></div>}
            </div>
          )}
          {tab === "effectifs" && <Effectifs club={club} role={role} teams={teams} players={players} members={members} staff={staff} guardians={guardians} profiles={profiles} reload={load} />}
          {tab === "convocations" && <Convocations club={club} role={role} teams={teams} players={players} events={events} attendance={attendance} meId={meId} reload={load} />}
          {tab === "messagerie" && <ClubMessagerie channels={channels} meId={meId} profiles={profiles} />}
          {tab === "documents" && <Documents club={club} teams={teams} players={players} docs={docs} reload={load} />}
          {tab === "membres" && isAdmin && <Membres club={club} members={members} profiles={profiles} reload={load} />}
          {tab === "enfants" && <MesEnfants players={players} teams={teams} />}
        </>
      )}
      <div style={{ marginTop: "1.5rem" }}><button className="btn btn--ghost btn--sm" onClick={onLeaveClub}>← Changer de club</button></div>
    </>
  );
}

/* ================================================================
   APPLI CLUB (connecté)
   ================================================================ */
function ClubApp({ meId, pseudo, onLogout }: { meId: string; pseudo: string; onLogout: () => void }) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return; setLoading(true);
    const r = await supabase.from("club_members").select("id,club_id,role,status,clubs(id,name,sport,invite_code)").eq("user_id", meId);
    const list = ((r.data as unknown) as Membership[]) || [];
    setMemberships(list);
    setLoading(false);
  }, [meId]);
  useEffect(() => { load(); }, [load]);

  const active = memberships.filter((m) => m.clubs);
  const current = selected ? active.find((m) => m.club_id === selected) : (active.length === 1 ? active[0] : null);

  return (
    <div className="cl-shell">
      <div className="esp-topbar">
        <div><p className="eyebrow" style={{ margin: 0 }}>Espace club</p><strong>{pseudo}</strong></div>
        <button className="btn btn--ghost btn--sm" onClick={onLogout}>Se déconnecter</button>
      </div>

      {loading ? <p className="muted">Chargement…</p> : memberships.length === 0 ? (
        <NoClub onDone={load} />
      ) : current ? (
        current.status === "en_attente" ? (
          <div className="esp-card esp-center"><h3>Demande envoyée ✅</h3><p className="muted">Ton adhésion à « {current.clubs?.name} » est en attente de validation par le club.</p><button className="btn btn--ghost btn--sm" onClick={() => setSelected(null)} style={{ marginTop: "1rem" }}>Retour</button></div>
        ) : (
          <ClubSpace membership={current} meId={meId} onLeaveClub={() => setSelected(null)} />
        )
      ) : (
        <>
          <h3>Mes clubs</h3>
          <div className="cl-clublist">
            {memberships.map((m) => (
              <button key={m.id} className="esp-card cl-clubcard" onClick={() => setSelected(m.club_id)}>
                <strong>{m.clubs?.name || "Club"}</strong>
                <span className="muted">{m.clubs?.sport} · {ROLE_LABEL[m.role]}{m.status === "en_attente" ? " · en attente" : ""}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: "1.2rem" }}><NoClub onDone={load} /></div>
        </>
      )}
    </div>
  );
}

/* ================================================================
   RACINE
   ================================================================ */
export default function Club() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<{ id: string; pseudo: string } | null>(null);

  const loadSession = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setMe(null); setReady(true); return; }
    const r = await supabase.from("profiles").select("id,pseudo").eq("id", session.user.id).maybeSingle();
    const p = r.data as { id: string; pseudo: string } | null;
    setMe({ id: session.user.id, pseudo: p?.pseudo || session.user.email || "Membre" });
    setReady(true);
  }, []);
  useEffect(() => {
    loadSession();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadSession());
    return () => sub.subscription.unsubscribe();
  }, [loadSession]);

  const logout = async () => { if (supabase) await supabase.auth.signOut(); setMe(null); };

  if (!SUPABASE_ENABLED) return <div className="esp-card esp-center"><h2>Espace club — en préparation</h2><p className="muted">Bientôt disponible.</p></div>;
  if (!ready) return <p className="muted">Chargement…</p>;
  if (!me) return <AuthClub />;
  return <ClubApp meId={me.id} pseudo={me.pseudo} onLogout={logout} />;
}
