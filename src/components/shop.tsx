"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { CATEGORIES, SHOP, checkoutUrl, type ShopProduct } from "@/lib/shop-data";

/* ---- média produit (jersey / symbol / image perso) ---- */
export function ProductMedia({ image, alt }: { image: string; alt?: string }) {
  if (image === "jersey") return <img className="pm-jersey" src="/jersey.jpg" alt={alt || ""} />;
  if (image === "symbol") return <img className="pm-symbol" src="/symbol.png" alt="" aria-hidden="true" />;
  return <img className="pm-photo" src={image} alt={alt || ""} />;
}

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }).replace(",00", "");

/* ---- carte produit avec ajout au panier ---- */
function ShopCard({ p }: { p: ShopProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState(p.sizes[0] || "Unique");
  const [added, setAdded] = useState(false);

  function onAdd() {
    if (p.soldOut) return;
    add({ slug: p.slug, name: p.name, price: p.price, size, image: p.image, externalId: p.externalId, buyUrl: p.buyUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className={"shop-card" + (p.soldOut ? " is-sold" : "")}>
      <Link href={`/boutique/${p.slug}`} className="shop-card-media" aria-label={p.name}>
        <ProductMedia image={p.image} alt={p.name} />
        {p.badge && <span className="shop-badge">{p.badge}</span>}
        {p.soldOut && <span className="shop-sold">Épuisé</span>}
      </Link>
      <div className="shop-card-body">
        <Link href={`/boutique/${p.slug}`} className="shop-card-name">{p.name}</Link>
        <div className="shop-card-price">
          {p.oldPrice && <span className="old">{euro(p.oldPrice)}</span>}
          <span className={p.oldPrice ? "sale" : ""}>{euro(p.price)}</span>
        </div>
        {!p.soldOut && (
          <>
            <div className="shop-sizes">
              {p.sizes.map((s) => (
                <button key={s} type="button"
                  className={"size-chip" + (s === size ? " on" : "")}
                  onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
            <button type="button" className={"btn btn--sm shop-add" + (added ? " ok" : "")} onClick={onAdd}>
              {added ? "Ajouté ✓" : "Ajouter au panier"}
            </button>
          </>
        )}
        {p.soldOut && <span className="btn btn--ghost btn--sm" style={{ opacity: .6, cursor: "default" }}>Bientôt de retour</span>}
      </div>
    </div>
  );
}

/* ---- boutique complète : filtres catégories + tri + grille ---- */
export function BoutiqueBrowser({ products }: { products: ShopProduct[] }) {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("featured");

  const cats = useMemo(
    () => CATEGORIES.filter((c) => products.some((p) => p.category === c.key)),
    [products]
  );

  const list = useMemo(() => {
    let l = cat === "all" ? products : products.filter((p) => p.category === cat);
    if (sort === "price-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [products, cat, sort]);

  return (
    <div className="shop-layout">
      {/* sidebar catégories */}
      <aside className="shp-side">
        <div className="shp-side-label">Catégories</div>
        <button className={"shop-catbtn" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>
          Tous les produits <span>{products.length}</span>
        </button>
        {cats.map((c) => {
          const n = products.filter((p) => p.category === c.key).length;
          return (
            <button key={c.key} className={"shop-catbtn" + (cat === c.key ? " on" : "")} onClick={() => setCat(c.key)}>
              {c.label} <span>{n}</span>
            </button>
          );
        })}
      </aside>

      {/* grille */}
      <div className="shop-main">
        <div className="shop-toolbar">
          <span className="shop-count">{list.length} produit{list.length > 1 ? "s" : ""}</span>
          <label className="shop-sort">
            Trier&nbsp;:
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">En vedette</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </label>
        </div>
        <div className="shp-grid">
          {list.map((p) => <ShopCard key={p.slug} p={p} />)}
        </div>
      </div>
    </div>
  );
}

/* ---- bloc achat sur la page produit ---- */
export function ProductBuy({ p }: { p: ShopProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState(p.sizes[0] || "Unique");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function onAdd() {
    if (p.soldOut) return;
    add({ slug: p.slug, name: p.name, price: p.price, size, image: p.image, externalId: p.externalId, buyUrl: p.buyUrl }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="pb">
      <div className="pb-label">Taille</div>
      <div className="shop-sizes lg">
        {p.sizes.map((s) => (
          <button key={s} type="button" className={"size-chip" + (s === size ? " on" : "")} onClick={() => setSize(s)}>{s}</button>
        ))}
      </div>

      <div className="pb-label">Quantité</div>
      <div className="pb-qty">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Moins">–</button>
        <span>{qty}</span>
        <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Plus">+</button>
      </div>

      <div className="pb-actions">
        {p.soldOut ? (
          <span className="btn" style={{ opacity: .6, cursor: "default" }}>Bientôt de retour</span>
        ) : (
          <button type="button" className={"btn btn--gold" + (added ? " ok" : "")} onClick={onAdd}>
            {added ? "Ajouté au panier ✓" : "Ajouter au panier"}<span className="arw">→</span>
          </button>
        )}
        <Link href="/panier" className="btn btn--ghost">Voir le panier</Link>
      </div>
    </div>
  );
}

/* ---- page panier ---- */
export function CartView() {
  const { items, subtotal, setQty, remove, ready } = useCart();

  if (!ready) return <p className="muted">Chargement du panier…</p>;

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <ProductMedia image="symbol" />
        <h2>Ton panier est vide</h2>
        <p className="muted">Découvre la collection Eden et compose ta tenue.</p>
        <Link href="/boutique" className="btn btn--gold">Voir la boutique<span className="arw">→</span></Link>
      </div>
    );
  }

  const shopUrl = checkoutUrl();

  return (
    <div className="cart-grid">
      <div>
        {items.map((it) => (
          <div className="cart-row" key={`${it.slug}|${it.size}`}>
            <Link href={`/boutique/${it.slug}`} className="thumb"><ProductMedia image={it.image} alt={it.name} /></Link>
            <div className="cart-row-info">
              <div className="cart-row-name">{it.name}</div>
              <div className="tmp">Taille {it.size}</div>
            </div>
            <div className="pb-qty sm">
              <button type="button" onClick={() => setQty(it.slug, it.size, it.qty - 1)} aria-label="Moins">–</button>
              <span>{it.qty}</span>
              <button type="button" onClick={() => setQty(it.slug, it.size, it.qty + 1)} aria-label="Plus">+</button>
            </div>
            <div className="cart-row-price">{euro(it.price * it.qty)}</div>
            <button className="cart-x" type="button" aria-label="Retirer" onClick={() => remove(it.slug, it.size)}>✕</button>
          </div>
        ))}

        {/* explication du fonctionnement */}
        <div className="shop-how">
          <h3>Comment ça marche&nbsp;?</h3>
          <ol>
            {SHOP.howItWorks.map((s, i) => (
              <li key={i}><strong>{s.title}.</strong> {s.text}</li>
            ))}
          </ol>
        </div>
      </div>

      <aside className="cart-summary">
        <h3>Ta sélection</h3>
        <div className="line"><span>Sous-total</span><span>{euro(subtotal)}</span></div>
        <div className="line"><span>Livraison</span><span>définie sur Nolt</span></div>
        <div className="line total"><span>Total indicatif</span><span>{euro(subtotal)}</span></div>

        {shopUrl ? (
          <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="btn btn--gold cart-checkout">
            Commander sur notre boutique<span className="arw">→</span>
          </a>
        ) : (
          <Link href="/contact" className="btn btn--gold cart-checkout">Nous contacter<span className="arw">→</span></Link>
        )}
        <p className="cart-note">
          La commande, la personnalisation et le paiement se font sur notre boutique officielle propulsée par <strong>Nolt</strong>. Garde cette liste sous les yeux pour retrouver tes pièces&nbsp;: prix ici indicatifs.
        </p>
      </aside>
    </div>
  );
}

/* ---- badge panier dans le header ---- */
export function CartBadge() {
  const { count, ready } = useCart();
  return (
    <Link href="/panier" className="cart-link" aria-label={`Panier (${count})`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M6 6 5 3H2" />
      </svg>
      {ready && count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
