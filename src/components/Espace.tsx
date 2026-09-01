"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase";
import type { Profile, Seance, Availability, SessionType, Announcement } from "@/lib/espace-types";
import SocialLinks from "./SocialIcons";

const supabase = getSupabase();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Colonnes profil (tolérant : repli si les colonnes enrichies n'existent pas encore)
const PROFILE_COLS = "id,pseudo,role,team,poste,rank,photo_url,socials,bio";
async function fetchProfiles(): Promise<Profile[]> {
  if (!supabase) return [];
  let r = await supabase.from("profiles").select(PROFILE_COLS);
  if (r.error) r = await supabase.from("profiles").select("id,pseudo,role,team");
  return (r.data as Profile[]) || [];
}
async function fetchMyProfile(uid: string): Promise<Profile | null> {
  if (!supabase) return null;
  let r = await supabase.from("profiles").select(PROFILE_COLS).eq("id", uid).maybeSingle();
  if (r.error) r = await supabase.from("profiles").select("id,pseudo,role,team").eq("id", uid).maybeSingle();
  return (r.data as Profile) || null;
}

// Réseaux stockés en texte "Label | url" par ligne → tableau {label,url}
function parseSocialsText(txt?: string | null): { label: string; url: string }[] {
  return (txt || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.indexOf("|");
    if (i !== -1) return { label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
    const m = line.match(/https?:\/\/\S+/);
    return m ? { label: line.replace(m[0], "").trim(), url: m[0] } : { label: "", url: line };
  }).filter((s) => s.url);
}

// Génère et télécharge un fichier .ics (agenda) à partir des séances
function downloadICS(seances: Seance[], teamName: string) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  const esc = (s: string) => (s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const now = dt(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eden Esport//Espace//FR", "CALSCALE:GREGORIAN", `X-WR-CALNAME:Eden ${teamName}`];
  for (const s of seances) {
    const start = new Date(s.starts_at);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);
    const title = (s.type === "match" ? "Match" : "Entraînement") + (s.title ? ` — ${s.title}` : "") + (s.opponent ? ` vs ${s.opponent}` : "");
    lines.push("BEGIN:VEVENT", `UID:${s.id}@edenesport.fr`, `DTSTAMP:${now}`, `DTSTART:${dt(s.starts_at)}`, `DTEND:${dt(end.toISOString())}`, `SUMMARY:${esc(title)}`);
    if (s.location) lines.push(`LOCATION:${esc(s.location)}`);
    if (s.notes) lines.push(`DESCRIPTION:${esc(s.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `eden-${teamName || "planning"}.ics`; a.click();
  URL.revokeObjectURL(url);
}

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
/*  ANNONCES INTERNES                                                  */
/* ------------------------------------------------------------------ */
function Announcements({ items, isStaff, team, onChange }: {
  items: Announcement[]; isStaff: boolean; team: string; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"team" | "all">("team");
  const [saving, setSaving] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      team: scope === "all" ? null : team, title: title.trim(), body: body.trim(),
    });
    setSaving(false);
    if (!error) { setTitle(""); setBody(""); setOpen(false); onChange(); }
    else alert("Publication impossible : " + error.message);
  }
  async function del(id: string) {
    if (!supabase || !confirm("Supprimer cette annonce ?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    onChange();
  }

  return (
    <section className="esp-block">
      <div className="esp-block-head">
        <h2>Annonces</h2>
        {isStaff && !open && <button className="btn btn--sm" onClick={() => setOpen(true)}>+ Annonce</button>}
      </div>
      {isStaff && open && (
        <form className="form esp-card" onSubmit={post} style={{ marginBottom: "1rem" }}>
          <div className="field"><label>Titre</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex : Match ce dimanche" required /></div>
          <div className="field"><label>Message</label><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Détails de l'annonce…"></textarea></div>
          <div className="esp-seg">
            <button type="button" className={scope === "team" ? "on" : ""} onClick={() => setScope("team")}>{teamLabel(team)}</button>
            <button type="button" className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>Toutes les équipes</button>
          </div>
          <div style={{ display: "flex", gap: ".6rem", marginTop: ".8rem" }}>
            <button className="btn btn--sm" type="submit" disabled={saving}>{saving ? "Publication…" : "Publier"}</button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <div className="esp-card esp-center"><p className="muted">Aucune annonce pour l&apos;instant.</p></div>
      ) : (
        <div className="esp-list">
          {items.map((a) => (
            <div className="esp-card esp-ann" key={a.id}>
              <div className="esp-ann-head">
                <h3>{a.title}</h3>
                {!a.team && <span className="esp-badge esp-training">Toutes équipes</span>}
              </div>
              <span className="esp-date">{fmtDate(a.created_at)}</span>
              {a.body ? <p className="esp-ann-body">{a.body}</p> : null}
              {isStaff && <button className="esp-del" onClick={() => del(a.id)}>Supprimer</button>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ACCUEIL — cockpit (prochaines séances + dispo à confirmer)          */
/* ------------------------------------------------------------------ */
function HomeView({ profile, team, seances, avails, announcements, isStaff, onRsvp, onChangeAnn }: {
  profile: Profile; team: string; seances: Seance[]; avails: Availability[];
  announcements: Announcement[]; isStaff: boolean;
  onRsvp: (id: string, st: "yes" | "no" | "maybe") => void; onChangeAnn: () => void;
}) {
  const now = Date.now();
  const future = seances
    .filter((s) => teamKey(s.team) === team && new Date(s.starts_at).getTime() > now - 3 * 3600 * 1000)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const nextTraining = future.find((s) => s.type === "training");
  const nextMatch = future.find((s) => s.type === "match");
  const nextAny = future[0];
  const myNext = nextAny ? avails.find((a) => a.session_id === nextAny.id && a.user_id === profile.id)?.status : undefined;

  const Mini = ({ s, kind }: { s?: Seance; kind: "training" | "match" }) => (
    <div className="esp-card esp-mini">
      <span className={"esp-badge esp-" + kind}>{kind === "match" ? "Prochain match" : "Prochain entraînement"}</span>
      {s ? (
        <>
          <div className="esp-mini-date">{fmtDate(s.starts_at)}</div>
          <div className="esp-mini-hour">{fmtHour(s.starts_at)}{s.opponent ? ` · vs ${s.opponent}` : ""}</div>
          {s.location ? <div className="muted" style={{ fontSize: ".85rem" }}>{s.location}</div> : null}
        </>
      ) : <p className="muted" style={{ marginTop: ".6rem" }}>Rien de prévu.</p>}
    </div>
  );

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Salut {profile.pseudo} 👋</h2>
      <div className="esp-home-grid">
        <Mini s={nextTraining} kind="training" />
        <Mini s={nextMatch} kind="match" />
      </div>

      {nextAny && !myNext && (
        <div className="esp-card esp-confirm">
          <p>Tu n&apos;as pas encore répondu pour <strong>{nextAny.type === "match" ? "le prochain match" : "le prochain entraînement"}</strong> ({fmtDate(nextAny.starts_at)} · {fmtHour(nextAny.starts_at)}). Tu viens ?</p>
          <div className="esp-rsvp">
            {STATUS.map((st) => (
              <button key={st.key} type="button" className={"esp-rsvp-btn esp-" + st.cls}
                onClick={() => onRsvp(nextAny.id, st.key)}>{st.label}</button>
            ))}
          </div>
        </div>
      )}

      <Announcements items={announcements} isStaff={isStaff} team={team} onChange={onChangeAnn} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CALENDRIER MENSUEL + export .ics                                    */
/* ------------------------------------------------------------------ */
function CalendarView({ seances, team }: { seances: Seance[]; team: string }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const teamSeances = seances.filter((s) => teamKey(s.team) === team);

  const y = month.getFullYear(), m = month.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // lundi=0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const sessionsOn = (d: number) => teamSeances.filter((s) => {
    const dt = new Date(s.starts_at);
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
  }).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  const monthLabel = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  return (
    <div>
      <div className="esp-cal-top">
        <div className="esp-cal-nav">
          <button className="btn btn--ghost btn--sm" onClick={() => setMonth(new Date(y, m - 1, 1))}>←</button>
          <strong style={{ textTransform: "capitalize", minWidth: 160, textAlign: "center" }}>{monthLabel}</strong>
          <button className="btn btn--ghost btn--sm" onClick={() => setMonth(new Date(y, m + 1, 1))}>→</button>
        </div>
        <button className="btn btn--sm" onClick={() => downloadICS(
          teamSeances.filter((s) => new Date(s.starts_at).getTime() > Date.now() - 24 * 3600 * 1000),
          teamLabel(team))}>📅 Ajouter à mon agenda</button>
      </div>
      <div className="esp-cal">
        <div className="esp-cal-dow">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="esp-cal-grid">
          {cells.map((d, i) => (
            <div className={"esp-cal-cell" + (d && isToday(d) ? " esp-cal-today" : "") + (d ? "" : " esp-cal-empty")} key={i}>
              {d && <span className="esp-cal-num">{d}</span>}
              {d && sessionsOn(d).map((s) => (
                <span key={s.id} className={"esp-cal-ev esp-" + s.type} title={`${fmtHour(s.starts_at)} ${s.title}`}>
                  {fmtHour(s.starts_at)} {s.type === "match" ? "🎮" : "🏋"}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="muted" style={{ fontSize: ".85rem", marginTop: ".8rem" }}>
        « Ajouter à mon agenda » télécharge les séances à venir (fichier .ics) à importer dans Google Agenda / Apple Calendrier.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MON PROFIL (édition self-service)                                   */
/* ------------------------------------------------------------------ */
function MyProfileForm({ profile, onSaved, onCancel }: { profile: Profile; onSaved: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    pseudo: profile.pseudo || "", poste: profile.poste || "", rank: profile.rank || "",
    photo_url: profile.photo_url || "", socials: profile.socials || "", bio: profile.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      pseudo: f.pseudo, poste: f.poste || null, rank: f.rank || null,
      photo_url: f.photo_url || null, socials: f.socials || null, bio: f.bio || null,
    }).eq("id", profile.id);
    setSaving(false);
    if (!error) onSaved();
    else alert("Enregistrement impossible : " + error.message);
  }

  return (
    <form className="form esp-card" onSubmit={save} style={{ marginBottom: "1.2rem" }}>
      <h3 style={{ marginBottom: ".8rem" }}>Mon profil</h3>
      <div className="esp-row">
        <div className="field"><label>Pseudo</label><input value={f.pseudo} onChange={(e) => set("pseudo", e.target.value)} required /></div>
        <div className="field"><label>Poste / rôle</label><input value={f.poste} onChange={(e) => set("poste", e.target.value)} placeholder="Duelist, Top…" /></div>
      </div>
      <div className="esp-row">
        <div className="field"><label>Rang</label><input value={f.rank} onChange={(e) => set("rank", e.target.value)} placeholder="Radiant, Diamant…" /></div>
        <div className="field"><label>Photo (lien)</label><input value={f.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" /></div>
      </div>
      <div className="field"><label>Réseaux (un par ligne : Label | lien)</label><textarea value={f.socials} onChange={(e) => set("socials", e.target.value)} placeholder="Twitch | https://twitch.tv/moi"></textarea></div>
      <div className="field"><label>Bio</label><textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Quelques mots sur toi…"></textarea></div>
      <div style={{ display: "flex", gap: ".6rem" }}>
        <button className="btn btn--sm" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  ÉQUIPE — roster interne                                             */
/* ------------------------------------------------------------------ */
function RosterView({ members, me, onSaved }: { members: Record<string, Profile>; me: Profile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const list = Object.values(members).sort((a, b) => (a.pseudo || "").localeCompare(b.pseudo || ""));

  return (
    <div>
      <div className="esp-block-head" style={{ marginBottom: "1rem" }}>
        <h2>L&apos;équipe</h2>
        {!editing && <button className="btn btn--sm" onClick={() => setEditing(true)}>Modifier mon profil</button>}
      </div>
      {editing && <MyProfileForm profile={me} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved(); }} />}
      {list.length === 0 ? (
        <div className="esp-card esp-center"><p className="muted">Aucun membre dans cette équipe pour l&apos;instant.</p></div>
      ) : (
        <div className="esp-roster">
          {list.map((p) => (
            <div className="esp-card esp-member" key={p.id}>
              <div className="esp-member-av">
                {p.photo_url ? <img src={p.photo_url} alt={p.pseudo} /> : <span>{(p.pseudo || "?").charAt(0).toUpperCase()}</span>}
              </div>
              <div className="esp-member-body">
                <div className="esp-member-top">
                  <strong>{p.pseudo}</strong>
                  {p.role === "staff" && <span className="esp-role esp-role-staff">Staff</span>}
                </div>
                <div className="muted" style={{ fontSize: ".85rem" }}>
                  {[p.poste, p.rank].filter(Boolean).join(" · ") || "—"}
                </div>
                {p.bio ? <p className="esp-member-bio">{p.bio}</p> : null}
                <SocialLinks socials={parseSocialsText(p.socials)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tableau de bord (connecté)                                         */
/* ------------------------------------------------------------------ */
function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [tab, setTab] = useState<"home" | "seances" | "week" | "calendar" | "team">("home");
  const [team, setTeam] = useState<string>(teamKey(profile.team) || "valorant");
  const [seances, setSeances] = useState<Seance[]>([]);
  const [avails, setAvails] = useState<Availability[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const isStaff = profile.role === "staff";

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const since = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    const [ssR, avR, prof, annR] = await Promise.all([
      supabase.from("sessions").select("*").gte("starts_at", since).order("starts_at", { ascending: true }),
      supabase.from("availabilities").select("*"),
      fetchProfiles(),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    ]);
    setSeances((ssR.data as Seance[]) || []);
    setAvails((avR.data as Availability[]) || []);
    const map: Record<string, Profile> = {};
    for (const p of prof) map[p.id] = p;
    setProfiles(map);
    setAnns((annR.data as Announcement[]) || []);
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

  const me = profiles[profile.id] || profile;
  // membres de l'équipe sélectionnée
  const teamMembers: Record<string, Profile> = {};
  for (const [id, p] of Object.entries(profiles)) if (teamKey(p.team) === team) teamMembers[id] = p;
  const annForTeam = anns.filter((a) => !a.team || teamKey(a.team) === team);
  const now = Date.now();
  const upcoming = seances
    .filter((s) => teamKey(s.team) === team && new Date(s.starts_at).getTime() > now - 3 * 3600 * 1000)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "home", label: "Accueil" },
    { key: "seances", label: "Séances" },
    { key: "week", label: "Dispos semaine" },
    { key: "calendar", label: "Calendrier" },
    { key: "team", label: "Équipe" },
  ];

  return (
    <>
      <div className="esp-topbar">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Espace équipe</p>
          <strong>{me.pseudo}</strong>
          <span className={"esp-role esp-role-" + me.role}>{isStaff ? "Staff" : "Joueur"}</span>
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
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading && tab !== "home" ? <p className="muted">Chargement…</p> : null}

      {tab === "home" && (
        <HomeView profile={me} team={team} seances={seances} avails={avails}
          announcements={annForTeam} isStaff={isStaff} onRsvp={onRsvp} onChangeAnn={load} />
      )}

      {tab === "seances" && (
        <>
          {isStaff && <CreateForm onCreated={load} defaultTeam={team} />}
          {upcoming.length === 0 ? (
            <div className="esp-card esp-center"><p className="muted">Aucune séance à venir pour le moment.</p></div>
          ) : (
            <div className="esp-list">
              {upcoming.map((s) => (
                <SeanceCard key={s.id} s={s} me={profile.id} isStaff={isStaff}
                  avails={avails} profiles={profiles} onRsvp={onRsvp} onDelete={onDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "week" && <WeeklyAvailability profile={me} profiles={teamMembers} />}
      {tab === "calendar" && <CalendarView seances={seances} team={team} />}
      {tab === "team" && <RosterView members={teamMembers} me={me} onSaved={load} />}
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
