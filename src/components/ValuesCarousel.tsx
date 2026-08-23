"use client";

import { useEffect, useState } from "react";

export default function ValuesCarousel({ values }: { values: [string, string][] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (values.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % values.length), 3800);
    return () => window.clearInterval(id);
  }, [values.length]);

  return (
    <div className="values-carousel" aria-live="polite">
      <div className="vc-stage">
        {values.map(([name, desc], idx) => (
          <div key={name} className={"vc-slide" + (idx === i ? " on" : "")} aria-hidden={idx !== i}>
            <div className="vc-index">0{idx + 1} · 0{values.length}</div>
            <h3 className="vc-name grad-text">{name}</h3>
            <p className="vc-desc">{desc}</p>
          </div>
        ))}
      </div>
      <div className="vc-dots">
        {values.map(([name], idx) => (
          <button key={name} className={idx === i ? "on" : ""} onClick={() => setI(idx)} aria-label={`Valeur ${idx + 1} : ${name}`} type="button" />
        ))}
      </div>
    </div>
  );
}
