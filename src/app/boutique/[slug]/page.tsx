import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/content";
import { Breadcrumb, SectionHead } from "@/components/ui";
import { ProductCard } from "@/components/cards";
import SizePicker from "@/components/SizePicker";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return { title: p ? p.name : "Produit" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const related = (await getProducts()).filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <>
      <div className="page-hero"><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Boutique", href: "/boutique" }, { label: p.name }]} />
      </div></div>
      <section className="section"><div className="wrap">
        <div className="product">
          <div className="product-media">
            {p.image === "jersey" ? <img src="/jersey.jpg" alt={p.name} /> : <img src="/symbol.png" alt="" style={{ width: "55%", opacity: 0.7 }} />}
          </div>
          <div>
            <span className="tag tag--gold">{p.category}</span>
            <h1 style={{ fontSize: "var(--fs-h1)", margin: ".6rem 0" }}>{p.name}</h1>
            <p className="price">{p.price} <span className="tmp" style={{ fontSize: ".8rem" }}>prix indicatif</span></p>
            <p className="muted" style={{ margin: "1rem 0" }}>{p.description}</p>
            <div style={{ fontFamily: "var(--f-display)", fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>Taille</div>
            <SizePicker sizes={p.sizes} />
            <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
              <Link href="/panier" className="btn">Ajouter au panier<span className="arw">→</span></Link>
              <Link href="/boutique" className="btn btn--ghost">Continuer</Link>
            </div>
            <div className="grid-2" style={{ marginTop: "1.6rem" }}>
              <div className="panel"><h3 style={{ fontSize: ".95rem" }}>Livraison</h3><p>Expédition sous 3 à 5 jours (à confirmer).</p></div>
              <div className="panel"><h3 style={{ fontSize: ".95rem" }}>Retours</h3><p>Retours gratuits sous 14 jours (à confirmer).</p></div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "3rem" }}>
          <SectionHead eyebrow="Vous aimerez aussi" title="Produits associés" />
          <div className="grid-3">{related.map((r) => <ProductCard key={r.slug} product={r} />)}</div>
        </div>
      </div></section>
    </>
  );
}
