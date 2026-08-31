// Icônes réseaux sociaux — détecte le réseau depuis le lien (ou le libellé)
// et affiche l'icône correspondante. Utilisé sur les fiches joueurs.

type Social = { label: string; url: string };

type Kind = "twitch" | "youtube" | "instagram" | "tiktok" | "discord" | "x" | "link";

function detect(s: Social): Kind {
  const t = `${s.url} ${s.label}`.toLowerCase();
  if (t.includes("twitch")) return "twitch";
  if (t.includes("youtube") || t.includes("youtu.be")) return "youtube";
  if (t.includes("instagram")) return "instagram";
  if (t.includes("tiktok")) return "tiktok";
  if (t.includes("discord")) return "discord";
  if (t.includes("twitter") || t.includes("x.com") || s.label.trim().toLowerCase() === "x") return "x";
  return "link";
}

const LABEL: Record<Kind, string> = {
  twitch: "Twitch", youtube: "YouTube", instagram: "Instagram",
  tiktok: "TikTok", discord: "Discord", x: "X", link: "Lien",
};

function Glyph({ kind }: { kind: Kind }) {
  switch (kind) {
    case "twitch":
      return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3 3 7v12h4v2h3l2-2h3l5-5V3H4Zm16 8-3 3h-4l-2 2v-2H7V5h13v6Z" /><path d="M15 7h2v4h-2zM10 7h2v4h-2z" /></svg>;
    case "youtube":
      return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.4-5a2.6 2.6 0 0 0-1.8-1.9C19 4.8 12 4.8 12 4.8s-7 0-8.8.3A2.6 2.6 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a2.6 2.6 0 0 0 1.8 1.9c1.8.3 8.8.3 8.8.3s7 0 8.8-.3a2.6 2.6 0 0 0 1.8-1.9c.4-1.6.4-5 .4-5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" /></svg>;
    case "instagram":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
    case "tiktok":
      return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.3 2.3 1.7 3.8 4 4v3c-1.5.1-2.9-.4-4-1.2v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 2 2.7V3h3Z" /></svg>;
    case "discord":
      return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.3.5c1.7.4 2.8 1 3.9 1.7A13 13 0 0 0 12 4.3c-2.3 0-4.5.4-7 1.4C6 5 7.1 4.4 8.8 4l-.2-.5A19.8 19.8 0 0 0 3.7 4.4C1.2 8.1.5 11.7.8 15.3a20 20 0 0 0 6 3l.8-1.3c-.7-.2-1.4-.6-2-1l.5-.4c3.8 1.8 8 1.8 11.8 0l.5.4c-.6.4-1.3.8-2 1l.8 1.3a20 20 0 0 0 6-3c.4-4.2-.6-7.8-2.7-10.9ZM8.9 13.5c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm6.2 0c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.7 1.9-1.7 1.9Z" /></svg>;
    case "x":
      return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7 8 8.3 12h-6.5l-5-6.6L5 22H2l7.5-8.6L1.5 2H8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 4H5.5l12.3 16Z" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>;
  }
}

export default function SocialLinks({ socials }: { socials?: Social[] }) {
  if (!socials || socials.length === 0) return null;
  return (
    <div className="soc-links">
      {socials.map((s) => {
        const kind = detect(s);
        return (
          <a key={s.url + s.label} href={s.url} target="_blank" rel="noopener noreferrer"
            className={"soc-ico soc-" + kind} aria-label={s.label || LABEL[kind]} title={s.label || LABEL[kind]}>
            <Glyph kind={kind} />
          </a>
        );
      })}
    </div>
  );
}
