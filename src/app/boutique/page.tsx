import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { BoutiqueBrowser } from "@/components/shop";
import { PRODUCTS, SHOP } from "@/lib/shop-data";

export const metadata: Metadata = { title: "Boutique" };

export default function BoutiquePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Boutique" }]}
        eyebrow="Store officiel" title="Portez l'héritage"
        lead="Une collection pensée comme une extension de la marque : maillots, sweats et pièces lifestyle aux finitions premium."
      />

      {/* bandeau explicatif du fonctionnement */}
      <div className="shop-explain"><div className="wrap">
        <div className="shop-explain-steps">
          {SHOP.howItWorks.map((s, i) => (
            <div className="shop-step" key={i}>
              <span className="shop-step-n">{i + 1}</span>
              <div><strong>{s.title}</strong><p>{s.text}</p></div>
            </div>
          ))}
        </div>
      </div></div>

      <section className="section"><div className="wrap">
        <BoutiqueBrowser products={PRODUCTS} />
        <p className="tmp" style={{ marginTop: "1.6rem" }}>* Prix indicatifs — la commande et le paiement se finalisent sur notre boutique officielle (Nolt).</p>
      </div></section>
    </>
  );
}
