"use client";

import { useState, type ReactNode } from "react";

export default function Filterable({
  options, items, gridClass,
}: {
  options: { label: string; value: string }[];
  items: { cat: string; node: ReactNode }[];
  gridClass: string;
}) {
  const [f, setF] = useState("all");
  return (
    <>
      <div className="filter-bar">
        {options.map((o) => (
          <button key={o.value} className={f === o.value ? "on" : ""} onClick={() => setF(o.value)} type="button">
            {o.label}
          </button>
        ))}
      </div>
      <div className={gridClass}>
        {items.filter((it) => f === "all" || it.cat === f).map((it, i) => (
          <div key={i} style={{ display: "contents" }}>{it.node}</div>
        ))}
      </div>
    </>
  );
}
