"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";

const supabase = getSupabase();

type Club = { id: string; name: string; sport?: string | null; invite_code?: string | null };
type Membership = { id: string; club_id: string; role: string; status: string; clubs?: Club | null };
type Team = { id: string; club_id: string; name: string; season?: string | null };
type Player = { id: string; club_id: string; team_id: string | null; first_name: string; last_name: string; birthdate?: string | null; licence_no?: string | null; status?: string | null; notes?: string | null };
type Member = { id: string; club_id: string; user_id: string; role: string; status: string };
type Guardian = { id: string; player_id: string; user_id: string };

const ROLE_LABEL: Record<string, string> = { dirigeant: "Dirigeant", educateur: "Éducateur", joueur: "Joueur", parent: "Parent" };

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
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  const load = useCallback(async () => {
    if (!supabase) return; setLoading(true);
    const [t, p, m] = await Promise.all([
      supabase.from("club_teams").select("*").eq("club_id", club.id).order("name"),
      supabase.from("players").select("*").eq("club_id", club.id),
      supabase.from("club_members").select("*").eq("club_id", club.id),
    ]);
    const tt = (t.data as Team[]) || []; setTeams(tt);
    setPlayers((p.data as Player[]) || []);
    const mm = (m.data as Member[]) || []; setMembers(mm);
    const teamIds = tt.map((x) => x.id);
    const [st, gu, pr] = await Promise.all([
      teamIds.length ? supabase.from("team_staff").select("*").in("team_id", teamIds) : Promise.resolve({ data: [] }),
      supabase.from("guardians").select("*"),
      supabase.from("profiles").select("id,pseudo"),
    ]);
    setStaff((st.data as { team_id: string; user_id: string }[]) || []);
    setGuardians((gu.data as Guardian[]) || []);
    const pm: Record<string, string> = {};
    for (const x of (pr.data as { id: string; pseudo: string }[]) || []) pm[x.id] = x.pseudo || "—";
    setProfiles(pm);
    setLoading(false);
  }, [club.id]);
  useEffect(() => { load(); }, [load]);

  const TABS = isAdmin ? [["dashboard", "Tableau de bord"], ["effectifs", "Effectifs"], ["membres", "Membres"]]
    : role === "educateur" ? [["dashboard", "Tableau de bord"], ["effectifs", "Effectifs"]]
      : role === "parent" ? [["dashboard", "Tableau de bord"], ["enfants", "Mes enfants"]]
        : [["dashboard", "Tableau de bord"]];

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
