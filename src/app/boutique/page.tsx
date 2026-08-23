import type { Metadata } from "next";
import { getProducts, filterOptions } from "@/lib/content";
import { PageHero } from "@/components/ui";
import { ProductCard } from "@/components/cards";
import Filterable from "@/components/Filterable";

export const metadata: Metadata = { title: "Boutique" };

export default async function BoutiquePage() {
  const products = await getProducts();
  const options = filterOptions(products.map((p) => [p.category, p.category]), "Tout");
  const items = products.map((p) => ({ cat: p.category, node: <ProductCard key={p.slug} product={p} /> }));
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Boutique" }]}
        eyebrow="Store officiel" title="Portez l'héritage"
        lead="Une collection pensée comme une extension de la marque : maillots, hoodies et pièces lifestyle aux finitions premium."
      />
      <section className="section"><div className="wrap">
        <Filterable options={options} items={items} gridClass="grid-3" />
        <p className="tmp" style={{ marginTop: "1.4rem" }}>* Boutique en préparation — prix indicatifs, paiement bientôt disponible.</p>
      </div></section>
    </>
  );
}
