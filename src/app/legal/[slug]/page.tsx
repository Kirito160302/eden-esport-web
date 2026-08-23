import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content";
import { PageHero } from "@/components/ui";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = LEGAL[slug];
  return { title: l ? l.title : "Légal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = LEGAL[slug];
  if (!l) notFound();
  return (
    <>
      <PageHero crumbs={[{ label: "Accueil", href: "/" }, { label: l.title }]} title={l.title} />
      <section className="section"><div className="wrap">
        <div className="prose" dangerouslySetInnerHTML={{ __html: l.bodyHtml }} />
      </div></section>
    </>
  );
}
