"use client";

import { useState } from "react";

/**
 * Affiche le logo du partenaire. Si l'image n'existe pas encore
 * (ou ne charge pas), on retombe proprement sur le nom en toutes
 * lettres — jamais d'image cassée.
 */
export default function PartnerLogo({
  name, logo, imgClass, textClass,
}: { name: string; logo?: string; imgClass?: string; textClass?: string }) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    return <img src={logo} alt={name} className={imgClass} onError={() => setFailed(true)} />;
  }
  return <span className={"pt-logo-text " + (textClass || "")}>{name}</span>;
}
