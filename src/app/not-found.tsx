import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap nf">
      <img src="/symbol.png" alt="" />
      <p className="eyebrow eyebrow--center">Erreur 404</p>
      <h1>Hors de<br />l&apos;<span className="grad-text">Eden</span></h1>
      <p>Tu t&apos;es égaré hors de l&apos;Eden. Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="btn btn--lg">Retour à l&apos;accueil<span className="arw">→</span></Link>
    </div>
  );
}
