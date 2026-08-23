import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, SectionHead } from "@/components/ui";
import { ProductMedia, ProductBuy } from "@/components/shop";
import { PRODUCTS } from "@/lib/shop-data";

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }).replace(",00", "");

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  return { title: p ? p.name : "Produit" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) notFound();
  const related = PRODUCTS.filter((x) => x.slug !== slug && x.category === p.category).slice(0, 3);
  const fallback = PRODUCTS.filter((x) => x.slug !== slug).slice(0, 3);
  const suggestions = related.length ? related : fallback;

  return (
    <>
      <div className="page-hero"><div className="wrap">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Boutique", href: "/boutique" }, { label: p.name }]} />
      </div></div>
      <section className="section"><div className="wrap">
        <div className="product">
          <div className="product-media">
            <ProductMedia image={p.image} alt={p.name} />
            {p.badge && <span className="shop-badge">{p.badge}</span>}
          </div>
          <div>
            <span className="tag tag--gold">{p.category}</span>
            <h1 style={{ fontSize: "var(--fs-h1)", margin: ".6rem 0" }}>{p.name}</h1>
            <p className="price">
              {p.oldPrice && <span className="old" style={{ marginRight: ".5rem" }}>{euro(p.oldPrice)}</span>}
              {euro(p.price)} <span className="tmp" style={{ fontSize: ".8rem" }}>prix indicatif</span>
            </p>
            <p className="muted" style={{ margin: "1rem 0 1.4rem" }}>{p.description}</p>

            <ProductBuy p={p} />

            <div className="grid-2" style={{ marginTop: "1.8rem" }}>
              <div className="panel"><h3 style={{ fontSize: ".95rem" }}>Commande & paiement</h3><p>Ta commande se finalise sur notre boutique officielle (Nolt) — mêmes articles, paiement sécurisé.</p></div>
              <div className="panel"><h3 style={{ fontSize: ".95rem" }}>Livraison & retours</h3><p>Expédition et retours gérés par notre boutique partenaire.</p></div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "3rem" }}>
          <SectionHead eyebrow="Vous aimerez aussi" title="Produits associés" />
          <div className="shp-grid">
            {suggestions.map((r) => (
              <Link key={r.slug} href={`/boutique/${r.slug}`} className="shop-card" style={{ textDecoration: "none" }}>
                <div className="shop-card-media"><ProductMedia image={r.image} alt={r.name} />{r.badge && <span className="shop-badge">{r.badge}</span>}</div>
                <div className="shop-card-body">
                  <span className="shop-card-name">{r.name}</span>
                  <div className="shop-card-price"><span>{euro(r.price)}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div></section>
    </>
  );
}
