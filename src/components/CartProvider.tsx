"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  size: string;
  qty: number;
  image: string;
  externalId?: string;
  buyUrl?: string;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "eden-cart-v1";
const keyOf = (slug: string, size: string) => `${slug}|${size}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // charge depuis localStorage au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // sauvegarde à chaque changement
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const k = keyOf(item.slug, item.size);
      const i = prev.findIndex((x) => keyOf(x.slug, x.size) === k);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setItems((prev) => prev.filter((x) => keyOf(x.slug, x.size) !== keyOf(slug, size)));
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (keyOf(x.slug, x.size) === keyOf(slug, size) ? { ...x, qty } : x))
        .filter((x) => x.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, x) => n + x.qty, 0);
  const subtotal = items.reduce((n, x) => n + x.price * x.qty, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotal, add, remove, setQty, clear, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return c;
}
