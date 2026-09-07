import type { Metadata } from "next";
import Club from "@/components/Club";

export const metadata: Metadata = {
  title: "Espace club",
  robots: { index: false, follow: false },
};

export default function ClubPage() {
  return (
    <section className="section" style={{ paddingTop: "6rem" }}>
      <div className="wrap"><Club /></div>
    </section>
  );
}
