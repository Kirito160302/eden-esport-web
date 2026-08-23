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
    </>
  );
}
