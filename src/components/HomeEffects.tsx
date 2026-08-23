"use client";

import { useEffect } from "react";

// Effets propres à l'accueil : compteurs animés, compte à rebours, champ de particules.
export default function HomeEffects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Compteurs
    const nums = Array.from(document.querySelectorAll<HTMLElement>(".stat .num"));
    const animate = (el: HTMLElement) => {
      const t = parseFloat(el.getAttribute("data-target") || "0");
      const suf = el.getAttribute("data-suffix") || "";
      if (reduce) { el.textContent = t + suf; return; }
      const dur = 1600, start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(t * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    let so: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      so = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { animate(e.target as HTMLElement); so!.unobserve(e.target); } }),
        { threshold: 0.6 }
      );
      nums.forEach((n) => so!.observe(n));
    } else {
      nums.forEach((n) => { n.textContent = (n.getAttribute("data-target") || "") + (n.getAttribute("data-suffix") || ""); });
    }

    // Compte à rebours
    const target = new Date("2026-11-15T20:00:00+01:00").getTime();
    const cd = {
      d: document.querySelector<HTMLElement>('[data-cd="d"]'),
      h: document.querySelector<HTMLElement>('[data-cd="h"]'),
      m: document.querySelector<HTMLElement>('[data-cd="m"]'),
      s: document.querySelector<HTMLElement>('[data-cd="s"]'),
    };
    const pad = (n: number) => String(n).padStart(2, "0");
    const tickCd = () => {
      let diff = target - Date.now();
      if (diff < 0) diff = 0;
      const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5), m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1e3);
      if (cd.d) cd.d.textContent = pad(d);
      if (cd.h) cd.h.textContent = pad(h);
      if (cd.m) cd.m.textContent = pad(m);
      if (cd.s) cd.s.textContent = pad(s);
    };
    tickCd();
    const iv = window.setInterval(tickCd, 1000);

    // Particules
    const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
    let raf = 0;
    let onResize: (() => void) | null = null;
    if (canvas && !reduce) {
      const ctx = canvas.getContext("2d")!;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0, H = 0;
      let parts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
      const resize = () => {
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W * DPR; canvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const count = Math.min(90, Math.floor((W * H) / 16000));
        parts = [];
        for (let i = 0; i < count; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.4, a: Math.random() * 0.5 + 0.15 });
      };
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i]; p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          for (let j = i + 1; j < parts.length; j++) {
            const q = parts[j], dx = p.x - q.x, dy = p.y - q.y, dist = dx * dx + dy * dy;
            if (dist < 9000) { ctx.strokeStyle = "rgba(155,123,255," + 0.1 * (1 - dist / 9000) + ")"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
          ctx.fillStyle = "rgba(184,156,255," + p.a + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      };
      resize(); draw();
      onResize = () => resize();
      window.addEventListener("resize", onResize);
    }

    return () => {
      window.clearInterval(iv);
      if (so) so.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
