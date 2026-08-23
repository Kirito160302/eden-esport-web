import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Effects from "@/components/Effects";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://eden-esport.fr"),
  title: { default: "EDEN ESPORT", template: "%s · EDEN ESPORT" },
  description:
    "Site officiel d'Eden Esport — structure esport française. We do not only build teams. We build a legacy.",
  openGraph: {
    title: "EDEN ESPORT",
    description: "We do not only build teams. We build a legacy.",
    images: ["/og-image.png"],
    type: "website",
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title: "EDEN ESPORT", images: ["/og-image.png"] },
  icons: { icon: "/symbol.png" },
};

export const viewport: Viewport = { themeColor: "#06060B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              name: "Eden Esport",
              sport: "Esports",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://eden-esport.fr",
              logo: (process.env.NEXT_PUBLIC_SITE_URL || "https://eden-esport.fr") + "/symbol.png",
              slogan: "We do not only build teams. We build a legacy.",
              areaServed: "FR",
            }),
          }}
        />
        <a href="#main" className="skip">Aller au contenu</a>
        <CartProvider>
          <Effects />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
