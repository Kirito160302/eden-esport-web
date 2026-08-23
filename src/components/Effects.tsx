"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Effets globaux réappliqués à chaque changement de page :
// barre de progression, apparitions au scroll, relief 3D des cartes.
export default function Effects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const prog = document.getElementById("progress");
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (prog) prog.style.transform = "scaleX(" + p + ")";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    let io: IntersectionObserver | null = null;
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((r) => r.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io!.unobserve(e.target); } }),
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach((r) => io!.observe(r));
    }

    const cleanups: (() => void)[] = [];
    if (!reduce && window.matchMedia("(pointer:fine)").matches) {
      document.querySelectorAll<HTMLElement>(".team-card,.action,.news-card,.shop-cat").forEach((card) => {
        card.setAttribute("data-tilt", "");
        const spot = document.createElement("span");
        spot.className = "spot";
        card.appendChild(spot);
        const move = (ev: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width;
          const py = (ev.clientY - r.top) / r.height;
          card.classList.add("tilting");
          card.style.transform = `perspective(760px) rotateX(${((py - 0.5) * -8).toFixed(2)}deg) rotateY(${((px - 0.5) * 8).toFixed(2)}deg) translateY(-8px) scale(1.015)`;
          spot.style.setProperty("--mx", px * 100 + "%");
          spot.style.setProperty("--my", py * 100 + "%");
        };
        const leave = () => { card.classList.remove("tilting"); card.style.transform = ""; };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); spot.remove(); });
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (io) io.disconnect();
      cleanups.forEach((f) => f());
    };
  }, [pathname]);

  return <div className="progress" id="progress" aria-hidden="true" />;
}
