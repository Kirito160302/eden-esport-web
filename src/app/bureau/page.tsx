import type { Metadata } from "next";
import Bureau from "@/components/Bureau";

export const metadata: Metadata = {
  title: "Espace bureau",
  robots: { index: false, follow: false },
};

export default function BureauPage() {
  return (
    <section className="section" style={{ paddingTop: "6rem" }}>
      <div className="wrap"><Bureau /></div>
    </section>
  );
}
