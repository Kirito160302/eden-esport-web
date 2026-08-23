import type { Metadata } from "next";
import { getArticles } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { NewsCard } from "@/components/cards";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  const all = await getArticles();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Blog" }]}
        eyebrow="Aller plus loin" title="Le blog"
        lead="Guides, analyses, coulisses et vie associative — des formats plus longs pour comprendre notre univers."
      />
      <section className="section"><div className="wrap"><div className="news-grid">
        {all.map((a) => <NewsCard key={a.slug} article={a} />)}
      </div></div></section>
    </>
  );
}
