"use client";
import { useState } from "react";

export default function SizePicker({ sizes }: { sizes: string[] }) {
  const [sel, setSel] = useState(0);
  return (
    <div className="size-opts">
      {sizes.map((s, i) => (
        <button key={s} type="button" className={i === sel ? "on" : ""} onClick={() => setSel(i)}>{s}</button>
      ))}
    </div>
  );
}
