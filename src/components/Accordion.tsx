"use client";
import { useState } from "react";

export default function Accordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      {items.map(([q, a], i) => (
        <div className={"acc" + (open === i ? " open" : "")} key={i}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)}>
            <span>{q}</span><span className="plus">+</span>
          </button>
          <div className="abody" style={{ maxHeight: open === i ? 240 : 0 }}><p>{a}</p></div>
        </div>
      ))}
    </>
  );
}
