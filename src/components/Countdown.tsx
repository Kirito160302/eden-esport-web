"use client";

import { useEffect, useState } from "react";

type T = { d: number; h: number; m: number; s: number };

export default function Countdown({ iso }: { iso: string }) {
  const [t, setT] = useState<T | null>(null);
  useEffect(() => {
    const target = new Date(iso).getTime();
    const tick = () => {
      let diff = target - Date.now();
      if (diff < 0) diff = 0;
      setT({ d: Math.floor(diff / 864e5), h: Math.floor((diff % 864e5) / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3) });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [iso]);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (!t) return null;
  const units: [keyof T, string][] = [["d", "Jours"], ["h", "Heures"], ["m", "Min"], ["s", "Sec"]];
  return (
    <div className="countdown">
      {units.map(([k, l]) => (
        <div className="cd-unit" key={k}><span className="v">{pad(t[k])}</span><span className="u">{l}</span></div>
      ))}
    </div>
  );
}
