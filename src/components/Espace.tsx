"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";
import type { Profile, Seance, Availability, SessionType } from "@/lib/espace-types";

const supabase = getSupabase();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/* ------------------------------------------------------------------ */
/*  Espace non configuré → message neutre (le site public n'est pas   */
/*  affecté). S'affiche tant que les variables Supabase sont absentes.*/
/* ------------------------------------------------------------------ */
function NotConfigured() {
  return (
    <div className="esp-card esp-center">
      <h2>Espace équipe — en préparation</h2>
      <p className="muted">
        L&apos;espace membres (plannings, matchs et disponibilités) sera bientôt disponible
        pour les joueurs et le staff d&apos;Eden. Reviens prochainement.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Écran de connexion (e-mail + mot de passe)                         */
/* ------------------------------------------------------------------ */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setState("error");
      setMsg(
        /invalid login|invalid credentials|credentials/i.test(error.message)
          ? "E-mail ou mot de passe incorrect."
          : /not confirmed/i.test(error.message)
          ? "Ton compte n'est pas encore activé. Contacte le staff."
          : "Connexion impossible. Réessaie dans un instant."
      );
    }
    // succès : onAuthStateChange (racine) recharge le profil → tableau de bord
  }

  return (
    <div className="esp-card esp-center" style={{ maxWidth: 460, margin: "0 auto" }}>
      <h2>Espace équipe</h2>
      <p className="muted">Réservé aux joueurs et au staff d&apos;Eden Esport.</p>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: "1rem" }}>
        <div className="field">
          <label>Ton adresse e-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom@exemple.com" autoComplete="email" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Ton mot de passe" autoComplete="current-password" />
        </div>
        {state === "error" && <div className="form-ok form-err show" role="alert">{msg}</div>}
        <div>
          <button className="btn" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Connexion…" : "Se connecter"}<span className="arw">→</span>
          </button>
        </div>
        <p className="form-note">Mot de passe oublié ou pas encore de compte ? Contacte le staff.</p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulaire staff : créer une séance / un match                     */
/* ------------------------------------------------------------------ */
function CreateForm({ onCreated, defaultTeam }: { onCreated: () => void; defaultTeam: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SessionType>("training");
  const [f, setF] = useState({ title: "", date: "", time: "", team: defaultTeam, opponent: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !f.date) return;
    setSaving(true);
    const starts_at = new Date(`${f.date}T${f.time || "19:00"}`).toISOString();
    const { error } = await supabase.from("sessions").insert({
      type,
      title: f.title || (type === "match" ? "Match" : "Entraînement"),
      starts_at,
      team: f.team || null,
      opponent: type === "match" ? f.opponent || null : null,
      location: f.location || null,
      notes: f.notes || null,
    });
    setSaving(false);
    if (!error) {
      setF({ title: "", date: "", time: "", team: defaultTeam, opponent: "", location: "", notes: "" });
      setOpen(false);
      onCreated();
    } else {
      alert("Création impossible : " + error.message);
    }
  }

  if (!open) return <button className="btn btn--sm" onClick={() => setOpen(true)}>+ Ajouter une séance</button>;

  return (
    <form className="form esp-card" onSubmit={submit} style={{ marginBottom: "1.2rem" }}>
      <div className="esp-seg">
        <button type="button" className={type === "training" ? "on" : ""} onClick={() => setType("training")}>Entraînement</button>
        <button type="button" className={type === "match" ? "on" : ""} onClick={() => setType("match")}>Match</button>
      </div>
      <div className="field"><label>Titre</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={type === "match" ? "ex : Match amical" : "ex : Scrim Valorant"} /></div>
      <div className="esp-row">
        <div className="field"><label>Date</label><input type="date" required value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div className="field"><label>Heure</label><input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} /></div>
      </div>
      <div className="esp-row">
        <div className="field"><label>Équipe</label>
          <select value={f.team} onChange={(e) => set("team", e.target.value)}>
            {TEAMS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        {type === "match" && <div className="field"><label>Adversaire</label><input value={f.opponent} onChange={(e) => set("opponent", e.target.value)} placeholder="Nom de l'équipe" /></div>}
      </div>
      <div className="field"><label>Lieu / lien</label><input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="En ligne, salle, lien Discord…" /></div>
      <div className="field"><label>Notes</label><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Infos complémentaires (optionnel)"></textarea></div>
      <div style={{ display: "flex", gap: ".6rem" }}>
        <button className="btn btn--sm" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer"}</button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte d'une séance : infos + dispos                                */
/* ------------------------------------------------------------------ */
const STATUS = [
  { key: "yes", label: "Présent", cls: "yes" },
  { key: "maybe", label: "Peut-être", cls: "maybe" },
  { key: "no", label: "Absent", cls: "no" },
] as const;

function SeanceCard({
  s, me, isStaff, avails, profiles, onRsvp, onDelete,
}: {
  s: Seance; me: string; isStaff: boolean;
  avails: Availability[]; profiles: Record<string, Profile>;
  onRsvp: (sessionId: string, status: "yes" | "no" | "maybe") => void;
  onDelete: (id: string) => void;
}) {
  const [showList, setShowList] = useState(false);
  const mine = avails.find((a) => a.session_id === s.id && a.user_id === me)?.status;
  const forS = avails.filter((a) => a.session_id === s.id);
  const count = (st: string) => forS.filter((a) => a.status === st).length;

  return (
    <div className="esp-card esp-seance">
      <div className="esp-seance-head">
        <span className={"esp-badge esp-" + s.type}>{s.type === "match" ? "Match" : "Entraînement"}</span>
        <span className="esp-date">{fmtDate(s.starts_at)} · {fmtHour(s.starts_at)}</span>
      </div>
      <h3>{s.title}{s.opponent ? <span className="esp-vs"> vs {s.opponent}</span> : null}</h3>
      <p className="esp-meta">
        {s.team ? <span>{teamLabel(s.team)}</span> : null}
        {s.location ? <span>· {s.location}</span> : null}
      </p>
      {s.notes ? <p className="esp-notes">{s.notes}</p> : null}

      {/* Ma réponse */}
      <div className="esp-rsvp">
        {STATUS.map((st) => (
          <button key={st.key} type="button"
            className={"esp-rsvp-btn esp-" + st.cls + (mine === st.key ? " on" : "")}
            onClick={() => onRsvp(s.id, st.key)}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Compteurs + vue staff */}
      <div className="esp-counts">
        <span className="esp-c esp-yes">{count("yes")} présents</span>
        <span className="esp-c esp-maybe">{count("maybe")} peut-être</span>
        <span className="esp-c esp-no">{count("no")} absents</span>
        {isStaff && forS.length > 0 && (
          <button type="button" className="esp-toggle" onClick={() => setShowList((v) => !v)}>
            {showList ? "Masquer" : "Voir qui"}
          </button>
        )}
      </div>
      {isStaff && showList && (
        <ul className="esp-people">
          {forS.map((a) => (
            <li key={a.id}><span className={"esp-dot esp-" + a.status}></span>{profiles[a.user_id]?.pseudo || "Joueur"} — {STATUS.find((x) => x.key === a.status)?.label}</li>
          ))}
        </ul>
      )}

      {isStaff && (
        <button type="button" className="esp-del" onClick={() => onDelete(s.id)}>Supprimer</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DISPOS DE LA SEMAINE — grille récurrente (jour × créneau)          */
/* ------------------------------------------------------------------ */
type WeekSlot = { user_id: string; weekday: number; slot: string; status: "yes" | "maybe" };
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = [
  { key: "aprem", label: "Après-midi", hours: "14h–18h" },
  { key: "soir", label: "Soirée", hours: "18h–21h" },
  { key: "nuit", label: "Nuit", hours: "21h–00h" },
] as const;

// Équipes — on normalise ce que contient profiles.team / sessions.team
const TEAMS = [
  { key: "valorant", label: "Valorant" },
  { key: "lol", label: "League of Legends" },
] as const;
function teamKey(t?: string | null): string {
  const s = (t || "").toLowerCase();
  if (s.includes("valo")) return "valorant";
  if (s.includes("lol") || s.includes("league")) return "lol";
  return "";
}
const teamLabel = (t?: string | null) => TEAMS.find((x) => x.key === teamKey(t))?.label || t || "";

function WeeklyAvailability({ profile, profiles }: { profile: Profile; profiles: Record<string, Profile> }) {
  const [view, setView] = useState<"me" | "team">("me");
  const [slots, setSlots] = useState<WeekSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null); // "wd-slot" ouvert en vue équipe
  const totalMembers = Math.max(1, Object.keys(profiles).length);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("weekly_slots").select("user_id,weekday,slot,status");
    setSlots((data as WeekSlot[]) || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const mine = (wd: number, sl: string) =>
    slots.find((s) => s.user_id === profile.id && s.weekday === wd && s.slot === sl)?.status;

  const cycle = async (wd: number, sl: string) => {
    if (!supabase) return;
    const cur = mine(wd, sl);
    const next = cur === undefined ? "yes" : cur === "yes" ? "maybe" : null; // dispo → peut-être → vide
    setSlots((prev) => {
      const others = prev.filter((s) => !(s.user_id === profile.id && s.weekday === wd && s.slot === sl));
      return next ? [...others, { user_id: profile.id, weekday: wd, slot: sl, status: next as "yes" | "maybe" }] : others;
    });
    if (next) {
      await supabase.from("weekly_slots").upsert(
        { user_id: profile.id, weekday: wd, slot: sl, status: next },
        { onConflict: "user_id,weekday,slot" }
      );
    } else {
      await supabase.from("weekly_slots").delete()
        .eq("user_id", profile.id).eq("weekday", wd).eq("slot", sl);
    }
  };

  // seuls les membres de l'équipe affichée (profiles est déjà filtré par équipe)
  const people = (wd: number, sl: string, st: "yes" | "maybe") =>
    slots.filter((s) => s.weekday === wd && s.slot === sl && s.status === st && profiles[s.user_id]);

  if (loading) return <p className="muted">Chargement…</p>;

  return (
    <div>
      <div className="esp-seg" style={{ marginBottom: "1rem" }}>
        <button className={view === "me" ? "on" : ""} onClick={() => setView("me")}>Mes dispos</button>
        <button className={view === "team" ? "on" : ""} onClick={() => setView("team")}>Vue équipe</button>
      </div>

      {view === "me" ? (
        <>
          <p className="muted" style={{ marginBottom: ".8rem", fontSize: ".9rem" }}>
            Clique une case pour indiquer ta dispo : 1 clic = <strong style={{ color: "#5bd08d" }}>Dispo</strong>,
            2 clics = <strong style={{ color: "#e8c35a" }}>Peut-être</strong>, 3 clics = vide.
            C&apos;est ta dispo <em>habituelle</em> de la semaine (modifiable à tout moment).
          </p>
          <div className="esp-week">
            <div className="esp-week-head"><span></span>{SLOTS.map((s) => <span key={s.key}>{s.label}<em className="esp-hrs">{s.hours}</em></span>)}</div>
            {DAYS.map((d, wd) => (
              <div className="esp-week-row" key={wd}>
                <span className="esp-week-day">{d}</span>
                {SLOTS.map((s) => {
                  const st = mine(wd, s.key);
                  return (
                    <button key={s.key} type="button"
                      className={"esp-cell" + (st ? " esp-" + st : "")}
                      onClick={() => cycle(wd, s.key)}
                      aria-label={`${d} ${s.label}`}>
                      {st === "yes" ? "✓" : st === "maybe" ? "~" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: ".8rem", fontSize: ".9rem" }}>
            Nombre de personnes dispo par créneau. Clique une case pour voir qui.
          </p>
          <div className="esp-week">
            <div className="esp-week-head"><span></span>{SLOTS.map((s) => <span key={s.key}>{s.label}<em className="esp-hrs">{s.hours}</em></span>)}</div>
            {DAYS.map((d, wd) => (
              <div className="esp-week-row" key={wd}>
                <span className="esp-week-day">{d}</span>
                {SLOTS.map((s) => {
                  const yes = people(wd, s.key, "yes");
                  const maybe = people(wd, s.key, "maybe");
                  const cellId = wd + "-" + s.key;
                  const ratio = yes.length / totalMembers;
                  const bg = yes.length === 0 ? "transparent"
                    : `rgba(91,208,141,${0.15 + Math.min(0.6, ratio * 0.7)})`;
                  return (
                    <button key={s.key} type="button" className="esp-cell esp-cell-team"
                      style={{ background: bg }}
                      onClick={() => setOpen(open === cellId ? null : cellId)}>
                      <strong>{yes.length}</strong>{maybe.length ? <span className="esp-cell-maybe">+{maybe.length}?</span> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {open && (() => {
            const [wdS, slK] = open.split("-");
            const wd = parseInt(wdS, 10);
            const yes = people(wd, slK, "yes");
            const maybe = people(wd, slK, "maybe");
            const sl = SLOTS.find((x) => x.key === slK);
            return (
              <div className="esp-card" style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: ".6rem" }}>{DAYS[wd]} — {sl?.label} <span className="muted" style={{ fontWeight: 400 }}>({sl?.hours})</span></h3>
                {yes.length === 0 && maybe.length === 0 ? (
                  <p className="muted">Personne pour l&apos;instant.</p>
                ) : (
                  <ul className="esp-people">
                    {yes.map((p) => <li key={p.user_id}><span className="esp-dot esp-yes"></span>{profiles[p.user_id]?.pseudo || "Membre"}</li>)}
                    {maybe.map((p) => <li key={p.user_id}><span className="esp-dot esp-maybe"></span>{profiles[p.user_id]?.pseudo || "Membre"} <span className="muted">(peut-être)</span></li>)}
                  </ul>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tableau de bord (connecté)                                         */
/* ------------------------------------------------------------------ */
function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [tab, setTab] = useState<"training" | "match" | "week">("training");
  const [team, setTeam] = useState<string>(teamKey(profile.team) || "valorant");
  const [seances, setSeances] = useState<Seance[]>([]);
  const [avails, setAvails] = useState<Availability[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const isStaff = profile.role === "staff";

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const [{ data: ss }, { data: av }, { data: pr }] = await Promise.all([
      supabase.from("sessions").select("*").gte("starts_at", since).order("starts_at", { ascending: true }),
      supabase.from("availabilities").select("*"),
      supabase.from("profiles").select("id,pseudo,role,team"),
    ]);
    setSeances((ss as Seance[]) || []);
    setAvails((av as Availability[]) || []);
    const map: Record<string, Profile> = {};
    for (const p of (pr as Profile[]) || []) map[p.id] = p;
    setProfiles(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRsvp = async (sessionId: string, status: "yes" | "no" | "maybe") => {
    if (!supabase) return;
    // maj optimiste
    setAvails((prev) => {
      const others = prev.filter((a) => !(a.session_id === sessionId && a.user_id === profile.id));
      return [...others, { id: "tmp-" + sessionId, session_id: sessionId, user_id: profile.id, status, updated_at: new Date().toISOString() }];
    });
    await supabase.from("availabilities").upsert(
      { session_id: sessionId, user_id: profile.id, status },
      { onConflict: "session_id,user_id" }
    );
    load();
  };

  const onDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Supprimer cette séance ?")) return;
    await supabase.from("sessions").delete().eq("id", id);
    load();
  };

  const list = seances.filter((s) => s.type === tab && teamKey(s.team) === team);
  // membres de l'équipe sélectionnée (pour la vue dispos globale)
  const teamMembers: Record<string, Profile> = {};
  for (const [id, p] of Object.entries(profiles)) if (teamKey(p.team) === team) teamMembers[id] = p;

  return (
    <>
      <div className="esp-topbar">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Espace équipe</p>
          <strong>{profile.pseudo}</strong>
          <span className={"esp-role esp-role-" + profile.role}>{isStaff ? "Staff" : "Joueur"}</span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onLogout}>Se déconnecter</button>
      </div>

      {/* Sélecteur d'équipe : le staff bascule entre les 2, le joueur voit la sienne */}
      <div className="esp-teamsel">
        {isStaff ? (
          TEAMS.map((t) => (
            <button key={t.key} className={"esp-teambtn esp-team-" + t.key + (team === t.key ? " on" : "")}
              onClick={() => setTeam(t.key)}>{t.label}</button>
          ))
        ) : (
          <span className={"esp-teambtn esp-team-" + team + " on"} style={{ cursor: "default" }}>
            {TEAMS.find((t) => t.key === team)?.label || "Mon équipe"}
          </span>
        )}
      </div>

      <div className="esp-seg esp-tabs">
        <button className={tab === "training" ? "on" : ""} onClick={() => setTab("training")}>Entraînements</button>
        <button className={tab === "match" ? "on" : ""} onClick={() => setTab("match")}>Matchs</button>
        <button className={tab === "week" ? "on" : ""} onClick={() => setTab("week")}>Dispos semaine</button>
      </div>

      {tab === "week" ? (
        <WeeklyAvailability profile={profile} profiles={teamMembers} />
      ) : (
        <>
          {isStaff && <CreateForm onCreated={load} defaultTeam={team} />}
          {loading ? (
            <p className="muted">Chargement…</p>
          ) : list.length === 0 ? (
            <div className="esp-card esp-center"><p className="muted">Aucun {tab === "match" ? "match" : "entraînement"} à venir pour le moment.</p></div>
          ) : (
            <div className="esp-list">
              {list.map((s) => (
                <SeanceCard key={s.id} s={s} me={profile.id} isStaff={isStaff}
                  avails={avails} profiles={profiles} onRsvp={onRsvp} onDelete={onDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Racine de l'espace                                                 */
/* ------------------------------------------------------------------ */
export default function Espace() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setProfile(null); setNoProfile(false); setReady(true); return; }
    const { data } = await supabase.from("profiles").select("id,pseudo,role,team").eq("id", session.user.id).maybeSingle();
    if (data) { setProfile(data as Profile); setNoProfile(false); }
    else { setProfile(null); setNoProfile(true); }
    setReady(true);
  }, []);

  useEffect(() => {
    loadProfile();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadProfile());
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const logout = async () => { if (supabase) await supabase.auth.signOut(); setProfile(null); };

  if (!SUPABASE_ENABLED) return <NotConfigured />;
  if (!ready) return <p className="muted">Chargement…</p>;
  if (profile) return <Dashboard profile={profile} onLogout={logout} />;
  if (noProfile) {
    return (
      <div className="esp-card esp-center" style={{ maxWidth: 460, margin: "0 auto" }}>
        <h2>Compte à finaliser</h2>
        <p className="muted">Ton accès existe mais ton profil n&apos;est pas encore configuré. Contacte le staff pour qu&apos;il te rattache à une équipe.</p>
        <button className="btn btn--ghost btn--sm" onClick={logout} style={{ marginTop: "1rem" }}>Se déconnecter</button>
      </div>
    );
  }
  return <Login />;
}
