import Link from "next/link";
import { getTeams, getArticles, getPartners, getProducts, getEvents, frDateToIso } from "@/lib/content";
import { TeamCard, NewsCard } from "@/components/cards";
import HomeEffects from "@/components/HomeEffects";
import PartnerLogo from "@/components/PartnerLogo";
import Countdown from "@/components/Countdown";

const ACTIONS: [string, string][] = [
  ["Compétition", "Des équipes exigeantes qui portent les couleurs d'Eden sur les scènes esport."],
  ["Événements", "Organisation de tournois, LAN et rassemblements gaming pour tous les publics."],
  ["Jeunesse & transmission", "Ateliers de découverte, sensibilisation et création de contenu."],
  ["Médiation esport", "Une passerelle entre l'esport, les familles et les institutions."],
  ["Communauté", "Une communauté vivante fédérée par les valeurs Eden."],
  ["Accompagnement", "Consulting et stratégie pour développer un projet gaming ou esport."],
];

export default async function Home() {
  const [teams, news, partners, products, events] = await Promise.all([getTeams(), getArticles("news"), getPartners(), getProducts(), getEvents()]);
  // prochain événement à venir (le plus proche dans le temps) pour la section « Prochain événement ».
  // On utilise la date ISO WordPress si présente, sinon on la déduit de la date affichée.
  const now = Date.now();
  const effIso = (e: (typeof events)[number]) => e.iso || frDateToIso(e.date);
  const nextEvent = events
    .filter((e) => { const i = effIso(e); return i ? new Date(i).getTime() > now : e.status === "upcoming"; })
    .sort((a, b) => { const ia = effIso(a), ib = effIso(b); return (ia ? new Date(ia).getTime() : Infinity) - (ib ? new Date(ib).getTime() : Infinity); })[0];
  const nextIso = nextEvent ? effIso(nextEvent) : undefined;
  // produit mis en avant : on privilégie un produit qui a une VRAIE photo
  // (pas le logo « symbol »), maillot en priorité, pour ne jamais afficher un visuel vide.
  const hasPhoto = (p?: (typeof products)[number]) => !!p && !!p.image && p.image !== "symbol";
  const resolveImg = (p?: (typeof products)[number]) => (!p ? "/jersey.jpg" : p.image === "jersey" ? "/jersey.jpg" : p.image === "symbol" ? "/jersey.jpg" : p.image);
  const withPhoto = products.filter(hasPhoto);
  const feat = withPhoto.find((p) => p.category === "maillots") ?? withPhoto[0] ?? products.find((p) => p.category === "maillots") ?? products[0];
  const featImg = resolveImg(feat);

  return (
    <>
      {/* HERO */}
      <section className="hero" aria-label="Introduction">
        <video className="hero-video" autoPlay muted loop playsInline preload="none" aria-hidden="true">
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-veil" aria-hidden="true"></div>
        <div className="hero-glow" aria-hidden="true"></div>
        <canvas id="hero-canvas" aria-hidden="true"></canvas>
        <div className="wrap">
          <img className="hero-symbol" src="/symbol.png" alt="Symbole Eden Esport" width={170} />
          <p className="eyebrow eyebrow--center">Structure Esport · France</p>
          <h1>EDEN<span className="sport">Esport</span></h1>
          <p className="hero-tag"><span>We do not only build teams.</span><br /><span className="l2">We build a <span className="grad-text">legacy</span>.</span></p>
          <p className="hero-sub">Eden ne construit pas seulement des équipes. Nous bâtissons une vision, une communauté et un héritage — unis par la passion, guidés par la discipline.</p>
          <div className="hero-actions">
            <Link href="/eden" className="btn btn--lg">Découvrir Eden<span className="arw">→</span></Link>
            <Link href="/esport" className="btn btn--ghost btn--lg">Nos équipes<span className="arw">→</span></Link>
          </div>
        </div>
        <div className="scroll-ind" aria-hidden="true"><span>Scroll</span><span className="line"></span></div>
      </section>

      {/* CHIFFRES */}
      <section className="section stats" aria-label="Eden en chiffres" style={{ paddingBlock: 0 }}>
        <div className="stats-grid">
          <div className="stat reveal"><span className="num" data-target="2024">2024</span><span className="lbl">Année de création</span></div>
          <div className="stat reveal d1"><span className="num" data-target="40" data-suffix="+">0</span><span className="lbl">Membres & bénévoles</span></div>
          <div className="stat reveal d2"><span className="num" data-target="2">0</span><span className="lbl">Équipes esport</span></div>
          <div className="stat reveal d3"><span className="num" data-target="6" data-suffix="+">0</span><span className="lbl">Événements portés</span></div>
          <div className="stat reveal d4"><span className="num" data-target="5" data-suffix="+">0</span><span className="lbl">Actions jeunesse</span></div>
          <div className="stat reveal d5"><span className="num" data-target="100" data-suffix="%">0</span><span className="lbl">D&apos;ambition</span></div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <div className="marquee-group" key={k}>
              <b>We build a legacy</b><span className="star">✦</span><b>Passion</b><span className="star">✦</span><b>Dépassement</b><span className="star">✦</span><b>Stratégie</b><span className="star">✦</span><b>Respect</b><span className="star">✦</span><b>Unité</b><span className="star">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ESSENCE */}
      <section className="section essence" aria-label="Essence de marque">
        <img className="watermark" src="/symbol.png" alt="" aria-hidden="true" />
        <div className="wrap essence-grid">
          <div className="reveal">
            <p className="eyebrow">L&apos;essence de marque</p>
            <h2 className="big" style={{ fontSize: "clamp(2rem,4.4vw,3.6rem)" }}>Plus qu&apos;une équipe.<br />Un <span className="grad-text">héritage</span>.</h2>
            <p>Eden Esport est une structure ambitieuse qui construit plus que des équipes : nous bâtissons un héritage. Unis par la passion, guidés par la discipline, nous visons l&apos;excellence sur et en dehors du jeu.</p>
            <p className="quote">Nous ne voulons pas simplement gagner des matchs. Nous voulons créer une communauté, transmettre une culture et laisser une trace qui dépasse la compétition.</p>
            <div className="values-mini">
              <span>Passion</span><span>Dépassement</span><span>Stratégie</span><span>Respect</span><span>Unité</span>
            </div>
          </div>
          <div className="essence-visual essence-visual--photo reveal d2">
            <img src="/aventure.jpg" alt="L'équipe Eden Esport lors d'un événement" />
          </div>
        </div>
      </section>

      {/* ÉQUIPES */}
      <section className="section" aria-label="Nos équipes">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">Nos équipes</p>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>L&apos;ambition sur tous les fronts</h2>
            <p>Des rosters bâtis autour de la discipline et de l&apos;esprit collectif. Chaque équipe Eden porte les mêmes valeurs : exigence, progression et unité.</p>
          </div>
          <div className="teams-grid">
            {teams.map((t) => <TeamCard key={t.slug} team={t} href="/esport" />)}
          </div>
        </div>
      </section>

      {/* PROCHAIN ÉVÉNEMENT */}
      {nextEvent && (
        <section className="section" aria-label="Prochain événement">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">À ne pas manquer</p>
              <h2 style={{ fontSize: "var(--fs-h2)" }}>Prochain événement</h2>
            </div>
            <div className="evt-next reveal d1">
              <Link href={`/evenements/${nextEvent.slug}`} className="evt-next-poster" aria-label={nextEvent.title}>
                <img src={nextEvent.image || "/symbol.png"} alt={nextEvent.title} />
              </Link>
              <div className="evt-next-body">
                <span style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <span className="tag tag--live"><span className="dot"></span>{nextEvent.tag}</span>
                  {nextEvent.category && <span className="tag tag--gold">{nextEvent.category}</span>}
                </span>
                <h3>{nextEvent.title}</h3>
                <p className="where">{nextEvent.date} · {nextEvent.place}</p>
                {nextEvent.description && <p>{nextEvent.description}</p>}
                {nextIso && <Countdown iso={nextIso} />}
                <Link href={`/evenements/${nextEvent.slug}`} className="btn btn--gold">Voir l&apos;événement<span className="arw">→</span></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ACTUALITÉS */}
      <section className="section" aria-label="Actualités">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">Actualités</p>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>Les dernières nouvelles d&apos;Eden</h2>
          </div>
          <div className="news-grid">
            {news.slice(0, 3).map((a) => <NewsCard key={a.slug} article={a} />)}
          </div>
        </div>
      </section>

      {/* NOS ACTIONS */}
      <section className="section actions" aria-label="Nos actions">
        <div className="wrap">
          <div className="section-head section-head--center reveal">
            <p className="eyebrow eyebrow--center">Notre écosystème</p>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>Eden agit sur tous les terrains</h2>
            <p>Bien plus qu&apos;une équipe compétitive : une structure engagée dans l&apos;événementiel, la transmission et l&apos;accompagnement de projets.</p>
          </div>
          <div className="actions-grid">
            {ACTIONS.map((a, i) => (
              <article className="action reveal" key={a[0]}>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 0 1 10 10M12 22A10 10 0 0 1 2 12" /></svg></span>
                <h3>{a[0]}</h3><p>{a[1]}</p>
              </article>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.4rem" }}>
            <Link href="/actions" className="btn btn--ghost">Découvrir nos actions<span className="arw">→</span></Link>
          </div>
        </div>
      </section>

      {/* BOUTIQUE */}
      <section className="section" aria-label="Boutique">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">Boutique</p>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>Portez l&apos;héritage</h2>
            <p>Une collection pensée comme une extension de la marque : maillots, hoodies et pièces lifestyle aux finitions premium.</p>
          </div>
          <div className="shop-grid">
            <article className="shop-feat notch reveal">
              <img src={featImg} alt={feat ? feat.name : "Maillot officiel Eden Esport"} />
              <div className="info">
                <span className="tag tag--gold">{feat?.badge || "Édition officielle"}</span>
                <h3>{feat ? feat.name : "Maillot Eden"}</h3>
                <p>Le maillot officiel de la structure. Design signature aux couleurs d&apos;Eden, matières techniques.</p>
                <Link href={feat ? `/boutique/${feat.slug}` : "/boutique"} className="btn btn--sm">Voir le produit<span className="arw">→</span></Link>
              </div>
            </article>
            <div className="shop-side">
              <Link className="shop-cat reveal d1" href="/boutique">
                <img className="glyph" src="/symbol.png" alt="" aria-hidden="true" />
                <div><span className="k">Textile</span><h4>Hoodies & T-shirts</h4></div>
                <span className="more">Voir la collection <span className="arw">→</span></span>
              </Link>
              <Link className="shop-cat reveal d2" href="/boutique">
                <img className="glyph" src="/symbol.png" alt="" aria-hidden="true" />
                <div><span className="k">Accessoires</span><h4>Casquettes & goodies</h4></div>
                <span className="more">Voir la collection <span className="arw">→</span></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PARTENAIRES */}
      <section className="section partners" aria-label="Partenaires">
        <div className="wrap">
          <div className="section-head section-head--center reveal">
            <p className="eyebrow eyebrow--center eyebrow--gold">Ils construisent Eden</p>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>Nos partenaires</h2>
            <p>Eden avance entouré de partenaires qui partagent sa vision. Découvrez celles et ceux qui écrivent cette histoire avec nous.</p>
          </div>
          <div className="reveal d1">
            <div className="home-partners">
              {partners.map((p) => (
                <Link key={p.name} href="/partenaires" className="home-partner" aria-label={p.name}>
                  <PartnerLogo name={p.name} logo={p.logo} />
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2.4rem" }}>
              <Link href="/partenaires" className="btn btn--gold">Devenir partenaire d&apos;Eden<span className="arw">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINALE */}
      <section className="finale" aria-label="Rejoindre">
        <img className="bgsym" src="/symbol.png" alt="" aria-hidden="true" />
        <div className="wrap">
          <p className="eyebrow eyebrow--center reveal">Rejoins l&apos;aventure</p>
          <h2 className="reveal d1" style={{ fontSize: "clamp(2.2rem,6vw,4.6rem)", fontWeight: 900 }}>Prêt à entrer<br />dans l&apos;<span className="grad-text">Eden</span> ?</h2>
          <p className="reveal d2">Joueur, créateur, bénévole, partenaire ou simple passionné : il y a une place pour toi dans notre héritage.</p>
          <div className="finale-actions reveal d3">
            <Link href="/rejoindre" className="btn btn--lg">Rejoindre la communauté<span className="arw">→</span></Link>
            <Link href="/contact" className="btn btn--ghost btn--lg">Contacter Eden<span className="arw">→</span></Link>
          </div>
        </div>
      </section>

      <HomeEffects />
    </>
  );
}
