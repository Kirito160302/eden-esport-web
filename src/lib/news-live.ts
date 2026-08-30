// ============================================================
//  ACTU MONDIALE ESPORT — agrégation RSS (LoL / Valorant)
//  ------------------------------------------------------------
//  Aucune clé requise : on lit des flux RSS publics côté serveur
//  (revalidation ISR). Si un flux ne répond pas, on l'ignore
//  silencieusement → la page retombe sur l'actu Eden.
//
//  Pour changer / ajouter une source : édite le tableau FEEDS.
//  N'importe quel flux RSS 2.0 standard fonctionne.
// ============================================================

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  date: string;   // affichage court (fr)
  iso?: string;   // pour le tri
  image?: string;
};

const FEEDS: Record<"lol" | "valorant", { url: string; source: string }[]> = {
  lol: [
    { url: "https://dotesports.com/league-of-legends/feed", source: "Dot Esports" },
    { url: "https://www.invenglobal.com/rss/news/lol", source: "Inven Global" },
  ],
  valorant: [
    { url: "https://dotesports.com/valorant/feed", source: "Dot Esports" },
    { url: "https://www.invenglobal.com/rss/news/valorant", source: "Inven Global" },
  ],
};

// ---- utilitaires de parsing (sans dépendance) ----
function decode(s: string): string {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "") // retire tout HTML résiduel
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

function attr(block: string, re: RegExp): string | undefined {
  const m = block.match(re);
  return m ? m[1] : undefined;
}

function extractImage(block: string): string | undefined {
  return (
    attr(block, /<media:content[^>]+url="([^"]+)"/i) ||
    attr(block, /<media:thumbnail[^>]+url="([^"]+)"/i) ||
    attr(block, /<enclosure[^>]+url="([^"]+)"[^>]*type="image/i) ||
    attr(block, /<img[^>]+src="([^"]+)"/i) ||
    undefined
  );
}

const fmt = (iso?: string): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

async function fetchFeed(url: string, source: string, revalidate: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (EdenEsport News Bot)", Accept: "application/rss+xml, application/xml, text/xml" },
      next: { revalidate },
    });
    if (!res.ok) {
      console.error("RSS", url, res.status);
      return [];
    }
    const xml = await res.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    const out: NewsItem[] = [];
    for (const it of items.slice(0, 8)) {
      const title = decode(tag(it, "title"));
      let link = decode(tag(it, "link"));
      // certains flux mettent le lien dans un attribut <link href="">
      if (!link) link = attr(it, /<link[^>]+href="([^"]+)"/i) || "";
      if (!title || !link) continue;
      const iso = tag(it, "pubDate") || tag(it, "dc:date") || tag(it, "published") || "";
      out.push({
        title,
        link: link.trim(),
        source,
        iso: iso.trim() || undefined,
        date: fmt(iso.trim()),
        image: extractImage(it),
      });
    }
    return out;
  } catch (e) {
    console.error("RSS fetch error", url, e);
    return [];
  }
}

export async function getWorldNews(game: "lol" | "valorant"): Promise<NewsItem[]> {
  const feeds = FEEDS[game] || [];
  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f.url, f.source, 1800)));
  const all: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);

  // tri par date décroissante, dédoublonnage par titre
  all.sort((a, b) => {
    const ta = a.iso ? Date.parse(a.iso) : 0;
    const tb = b.iso ? Date.parse(b.iso) : 0;
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
  });
  const seen = new Set<string>();
  const uniq: NewsItem[] = [];
  for (const n of all) {
    const key = n.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(n);
    if (uniq.length >= 6) break;
  }
  return uniq;
}
