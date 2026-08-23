import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Panier" };

export default function PanierPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Accueil", href: "/" }, { label: "Boutique", href: "/boutique" }, { label: "Panier" }]} title="Ton panier" />
      <section className="section"><div className="wrap grid-2" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div>
          <div className="cart-row"><div className="thumb"><img src="/jersey.jpg" alt="" /></div><div><div style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>Maillot Eden 2026</div><div className="tmp">Taille M · Édition officielle</div></div><div style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>59 €</div><button className="btn btn--ghost btn--sm" type="button" aria-label="Retirer">✕</button></div>
          <div className="cart-row"><div className="thumb"><img src="/symbol.png" alt="" /></div><div><div style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>Hoodie Eden</div><div className="tmp">Taille L · Textile</div></div><div style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>69 €</div><button className="btn btn--ghost btn--sm" type="button" aria-label="Retirer">✕</button></div>
          <p className="tmp" style={{ marginTop: "1rem" }}>* Panier de démonstration — le tunnel d&apos;achat sera connecté à la solution e-commerce.</p>
        </div>
        <div className="cart-summary">
          <h3 style={{ fontFamily: "var(--f-display)", marginBottom: "1rem" }}>Récapitulatif</h3>
          <div className="line"><span>Sous-total</span><span>128 €</span></div>
          <div className="line"><span>Livraison</span><span>Offerte</span></div>
          <div className="field" style={{ margin: ".8rem 0" }}><label>Code promo</label><input type="text" placeholder="EDEN2026" /></div>
          <div className="line total"><span>Total</span><span>128 €</span></div>
          <Link href="/contact" className="btn" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>Bientôt disponible<span className="arw">→</span></Link>
        </div>
      </div></section>
    </>
  );
}
