import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { CartView } from "@/components/shop";

export const metadata: Metadata = { title: "Panier" };

export default function PanierPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Accueil", href: "/" }, { label: "Boutique", href: "/boutique" }, { label: "Panier" }]} title="Ton panier" />
      <section className="section"><div className="wrap">
        <CartView />
      </div></section>
    </>
  );
}
