import Link from "next/link";
import type { ReactNode } from "react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
          {i < items.length - 1 && <span className="sep">/</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({
  crumbs, eyebrow, eyebrowGold, title, lead, children,
}: {
  crumbs?: { label: string; href?: string }[];
  eyebrow?: string;
  eyebrowGold?: boolean;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-hero">
      <div className="wrap">
        {crumbs && <Breadcrumb items={crumbs} />}
        {eyebrow && <p className={"eyebrow" + (eyebrowGold ? " eyebrow--gold" : "")}>{eyebrow}</p>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function SectionHead({ eyebrow, title, lead, center }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; center?: boolean }) {
  return (
    <div className={"section-head" + (center ? " section-head--center" : "")}>
      {eyebrow && <p className={"eyebrow" + (center ? " eyebrow--center" : "")}>{eyebrow}</p>}
      <h2 style={{ fontSize: "var(--fs-h2)" }}>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}
