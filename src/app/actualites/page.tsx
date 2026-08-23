import type { Metadata } from "next";
import { getArticles } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { NewsCard } from "@/components/cards";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Actualités" };

export default async function ActualitesPage() {
  const news = await getArticles("news");
  const items = news.map((a) => ({ cat: a.category, node: <NewsCard key={a.slug} article={a} /> }));
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Actualités" }]}
        eyebrow="Le fil Eden" title="Actualités"
        lead="Toute la vie de la structure : annonces, coulisses, esport et communauté."
      />
      <section className="section"><div className="wrap">
        <Filterable
          options={[{ label: "Tout", value: "all" }, { label: "Structure", value: "Structure" }, { label: "Esport", value: "Esport" }, { label: "Communauté", value: "Communauté" }]}
          items={items} gridClass="news-grid"
        />
        <p className="tmp" style={{ marginTop: "1.4rem" }}>* Articles d&apos;exemple — contenu éditorial via le CMS.</p>
      </div></section>
    </>
  );
}
