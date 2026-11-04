import React, { useState } from "react";
import { Link } from "react-router-dom";
import ProductVisual from "./ProductVisual.jsx";
import { colorToHex } from "../utils/colors.js";
import { useCart } from "../context/CartContext.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function Stars({ rating }) {
  const rawRating = Number(rating) || 0;

  // Si la note est sur 10 : 7/10 devient 3.5/5
  const value =
    rawRating > 5
      ? Math.min(5, Math.max(0, rawRating / 2))
      : Math.min(5, Math.max(0, rawRating));

  const fullStars = Math.floor(value);
  const hasHalfStar = value - fullStars >= 0.5;

  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label={`Note : ${rawRating}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = star <= fullStars;
        const isHalf = star === fullStars + 1 && hasHalfStar;

        if (isFull) {
          return (
            <span
              key={star}
              className="text-[15px] leading-none text-yellow-400"
              aria-hidden="true"
            >
              ★
            </span>
          );
        }

        if (isHalf) {
          return (
            <span
              key={star}
              className="text-[15px] leading-none"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(90deg, #FACC15 50%, #CBD5E1 50%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★
            </span>
          );
        }

        return (
          <span
            key={star}
            className="text-[15px] leading-none text-slate-300"
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 7h15l-1.5 9h-12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 7 5 4H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="20" r="1.3" fill="currentColor" />
      <circle cx="18" cy="20" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { add } = useCart();

  const [adding, setAdding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const discount = product.compareAtPrice
    ? Math.round(
        100 - (product.price / product.compareAtPrice) * 100
      )
    : null;

  const outOfStock = Number(product.stock) <= 0;

  const confirmQuickAdd = async () => {
    if (outOfStock) return;

    try {
      setAdding(true);

      await add(
        product.id,
        1,
        product.sizes?.[0],
        product.colors?.[0]
      );

      setAdding(false);
      setShowConfirm(false);
    } catch (error) {
      console.error(error);
      setAdding(false);
    }
  };

  return (
    <>
      <article className="group">

        {/* IMAGE */}
        <Link
          to={`/produit/${product.id}`}
          className="block"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface border hairline shadow-sm">

            <ProductVisual
              image={product.image}
              className="w-full h-full transition-transform duration-500 group-hover:scale-[1.035]"
            />

            {/* BADGES */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">

              <div className="flex flex-wrap gap-2">

                {product.isNew && (
                  <span className="bg-accent text-white text-[9px] uppercase tracking-widest2 font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                    Nouveau
                  </span>
                )}

                {discount && (
                  <span className="bg-sale text-white text-[9px] uppercase tracking-widest2 font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                    -{discount}%
                  </span>
                )}

              </div>

              {product.stock <= 0 && (
                <span className="bg-white/95 backdrop-blur-sm text-sale border border-red-100 text-[9px] uppercase tracking-widest2 font-bold px-2.5 py-1.5 rounded-full">
                  Épuisé
                </span>
              )}

            </div>

            {/* QUICK ADD */}
            {!outOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                disabled={adding}
                className="
                  absolute
                  bottom-3
                  left-3
                  right-3
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-accent
                  text-white
                  rounded-xl
                  py-3
                  text-[10px]
                  uppercase
                  tracking-widest2
                  font-bold
                  translate-y-16
                  group-hover:translate-y-0
                  transition-all
                  duration-300
                  hover:bg-primary-dark
                  hover:shadow-lg
                  hover:shadow-blue-600/15
                  disabled:opacity-70
                "
              >
                <CartIcon />

                {adding
                  ? "Ajout..."
                  : "Ajouter au panier"}
              </button>
            )}

          </div>
        </Link>

        {/* PRODUCT INFO */}
        <div className="pt-4">

          {/* RATING */}
          <div className="flex items-center gap-2 mb-2">

            <Stars rating={product.rating} />

            <span className="text-[10px] text-gray">
              ({product.reviewCount || 0})
            </span>

          </div>

          {/* CATEGORY */}
          <div className="text-[10px] uppercase tracking-widest2 text-gray mb-1.5">
            {product.subcategory || product.category}
          </div>

          {/* NAME */}
          <Link
            to={`/produit/${product.id}`}
            className="block"
          >
            <h3 className="font-display font-bold text-[15px] leading-snug group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* PRICE */}
          <div className="flex items-center gap-2 mt-2">

            <span
              className={`font-display font-bold text-sm ${
                discount ? "text-sale" : "text-ink"
              }`}
            >
              {product.price.toLocaleString("fr-FR")} €
            </span>

            {product.compareAtPrice && (
              <span className="text-xs text-gray line-through">
                {product.compareAtPrice.toLocaleString("fr-FR")} €
              </span>
            )}

          </div>

          {/* COLORS */}
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-2 mt-3">

              <div className="flex gap-1.5">

                {product.colors
                  .slice(0, 4)
                  .map((color) => (
                    <span
                      key={color}
                      className="w-3.5 h-3.5 rounded-full border border-line shadow-sm"
                      style={{
                        backgroundColor: colorToHex(color),
                      }}
                      title={color}
                    />
                  ))}

              </div>

              {product.colors.length > 4 && (
                <span className="text-[10px] text-gray">
                  +{product.colors.length - 4}
                </span>
              )}

            </div>
          )}

          {/* OUT OF STOCK */}
          {outOfStock && (
            <div className="mt-3 text-[10px] uppercase tracking-widest2 font-bold text-sale">
              Produit indisponible
            </div>
          )}

          {/* VIEW PRODUCT */}
          <Link
            to={`/produit/${product.id}`}
            className="
              inline-flex
              items-center
              gap-2
              mt-4
              text-[10px]
              uppercase
              tracking-widest2
              font-bold
              text-gray
              hover:text-accent
              transition-colors
            "
          >
            Voir le produit
            <ArrowIcon />
          </Link>

        </div>
      </article>

      {/* CONFIRMATION */}
      <ConfirmDialog
        open={showConfirm}
        title="Ajouter au panier ?"
        message={`« ${product.name} » sera ajouté à votre panier.`}
        confirmLabel="Ajouter"
        loading={adding}
        onConfirm={confirmQuickAdd}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}