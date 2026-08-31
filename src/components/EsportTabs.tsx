"use client";

import { useState } from "react";
import Modal from "./Modal";
import SocialLinks from "./SocialIcons";
import type { EGame, EPlayer } from "@/lib/esport-data";

function ytId(s: string): string {
  const m = s.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return m ? m[1] : s;
}
function nextMatchIndex(cal: EGame["calendar"]): number {
  const now = Date.now();
  let best = -1, bestT = Infinity;
  cal.forEach((m, i) => {
    if (!m.iso) return;
    const t = new Date(m.iso).getTime();
    if (t >= now && t < bestT) { bestT = t; best = i; }
  });
  return best;
}

function PlayerAvatar({ p }: { p: EPlayer }) {
  return p.photo
    ? <img className="rp-photo" src={p.photo} alt={p.pseudo} />
    : <span className="rp-ini">{p.pseudo.charAt(0)}</span>;
}

export default function EsportTabs({ games }: { games: EGame[] }) {
  const [g, setG] = useState(0);
  const [player, setPlayer] = useState<EPlayer | null>(null);
  const game = games[g];
  const nextIdx = nextMatchIndex(game.calendar);

  return (
    <div className="esport-tabs">
      {/* MENU DES JEUX */}
      <div className="game-tabs" role="tablist" aria-label="Jeux">
        {games.map((gm, i) => (
          <button key={gm.key} className={"game-tab" + (i === g ? " on" : "")} onClick={() => setG(i)} type="button" role="tab" aria-selected={i === g}>
            {gm.label}
          </button>
        ))}
      </div>

      {/* PALMARÈS */}
      <div className="es-block">
        <p className="eyebrow eyebrow--gold">Palmarès</p>
        {game.palmares.length > 0 ? (
          <div className="palmares-grid">
            {game.palmares.map((pl, i) => (
              <div className="palmares-item" key={i}>
                <span className="trophy" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 5H5v1a3 3 0 0 0 3 3M16 5h3v1a3 3 0 0 1-3 3" /><path d="M12 12v4M9 20h6M10 20l.5-4h3l.5 4" /></svg></span>
                <div className="place">{pl.place}</div>
                <div className="event">{pl.event}</div>
                <div className="year">{pl.year}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="tmp">Palmarès à venir — les premiers résultats de l&apos;équipe apparaîtront ici.</p>
        )}
      </div>

      {/* JOUEURS */}
      <div className="es-block">
        <p className="eyebrow">Le roster</p>
        <div className="roster-grid">
          {game.roster.map((p) => (
            <button key={p.slug} className="roster-player card-btn" type="button" onClick={() => setPlayer(p)}>
              <div className="rp-media"><PlayerAvatar p={p} /><span className="tag role">{p.role}</span></div>
              <div className="rp-body">
                <div className="rp-pseudo">{p.pseudo}</div>
                {p.name && p.name !== "—" && <div className="rp-name">{p.name}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="es-block">
        <p className="eyebrow">Calendrier de la saison</p>
        {game.calendar.length > 0 ? (
          <>
            {game.calendar.map((m, i) => (
              <div className={"match es-match" + (i === nextIdx ? " match--next" : "")} key={i}>
                {i === nextIdx && <span className="next-badge">Prochain</span>}
                <span className="comp">{m.competition}</span>
                <span className="teams">Eden — {m.opponent}</span>
                <span className="date">{m.date}</span>
                <span className="score">{m.result || "à venir"}</span>
              </div>
            ))}
          </>
        ) : (
          <p className="tmp">Calendrier à venir — les prochains matchs seront affichés ici.</p>
        )}
      </div>

      {/* REPLAYS */}
      <div className="es-block">
        <p className="eyebrow">Replays</p>
        {game.replays.length > 0 ? (
          <div className="replay-grid">
            {game.replays.map((r, i) => (
              <div className="replay" key={i}>
                <div className="replay-frame">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${ytId(r.youtube)}`} title={r.title} loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <p className="replay-title">{r.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="tmp">Replays à venir.</p>
        )}
      </div>

      {/* MODALE JOUEUR */}
      <Modal open={!!player} onClose={() => setPlayer(null)}>
        {player && (
          <>
            <div className="pl-modal-head">
              <div className="pl-modal-photo">{player.photo ? <img src={player.photo} alt={player.pseudo} /> : <span className="rp-ini" style={{ fontSize: "2.4rem" }}>{player.pseudo.charAt(0)}</span>}</div>
              <div>
                <span className="tag role">{player.role}</span>
                <h3 className="modal-title" style={{ margin: ".5rem 0 .2rem" }}>{player.pseudo}</h3>
                {player.name && player.name !== "—" && <div className="muted">{player.name}</div>}
              </div>
            </div>
            <div className="pl-socials">
              {player.socials && player.socials.length > 0
                ? <SocialLinks socials={player.socials} />
                : <span className="tmp">Réseaux à venir.</span>}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
