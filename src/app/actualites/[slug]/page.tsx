import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/content";
import { Breadcrumb } from "@/components/ui";

export async function generateStaticParams() {
  const all = await getArticles();
  return all.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  return { title: a ? a.title : "Article" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();
  const all = await getArticles();
  const i = all.findIndex((x) => x.slug === slug);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const related = all.filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <>
      <div className="page-hero"><div className="wrap" style={{ maxWidth: 820 }}>
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Actualités", href: "/actualites" }, { label: a.category }]} />
        <p className="eyebrow">{a.category} · {a.date}</p>
        <h1>{a.title}</h1>
      </div></div>
      <section className="section"><div className="wrap" style={{ maxWidth: 820 }}>
        <div className="news-thumb" style={{ aspectRatio: "21/9", marginBottom: "2rem", border: "1px solid var(--line-2)" }}>
          <span className="glyph" style={{ opacity: 0.35, display: "grid", placeItems: "center", height: "100%" }}><img src="/symbol.png" alt="" /></span>
        </div>
        <div className="prose" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "2.5rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href={`/actualites/${prev.slug}`} className="btn btn--ghost btn--sm">← Précédent</Link>
          <Link href="/actualites" className="btn btn--sm">Toutes les actus</Link>
          <Link href={`/actualites/${next.slug}`} className="btn btn--ghost btn--sm">Suivant →</Link>
        </div>
      </div></section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
          <div className="section-head"><p className="eyebrow">À lire aussi</p><h2 style={{ fontSize: "var(--fs-h2)" }}>Autres articles</h2></div>
          <div className="news-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/actualites/${r.slug}`} className="news-card" style={{ textDecoration: "none" }}>
                <div className="news-thumb"><span className="glyph"><img src="/symbol.png" alt="" /></span></div>
                <div className="news-body">
                  <div className="news-meta"><span className="cat">{r.category}</span><span>{r.date}</span></div>
                  <h3>{r.title}</h3><p>{r.excerpt}</p>
                  <span className="more">Lire <span className="arw">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div></section>
      )}
    </>
  );
}
