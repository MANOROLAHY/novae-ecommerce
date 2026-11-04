
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProduct } from "../context/api.js";
import { useCart } from "../context/CartContext.jsx";
import ProductVisual from "../components/ProductVisual.jsx";
import { colorToHex } from "../utils/colors.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

function Stars({ rating }) {
  const value = Number(rating) || 0;
  const stars = value > 5 ? value / 2 : value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= stars
              ? "text-yellow-400 text-base"
              : "text-slate-300 text-base"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [status, setStatus] = useState("idle");
  const [notFound, setNotFound] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);

    fetchProduct(id)
      .then((data) => {
        setProduct(data);
        setSize(data.sizes?.[0] || "");
        setColor(data.colors?.[0] || "");
        setQuantity(1);
      })
      .catch(() => {
        setNotFound(true);
      });
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--novae-bg)]">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <div className="text-sm font-bold uppercase tracking-widest text-accent">
            NOVAÉ
          </div>

          <h1 className="mt-4 text-4xl font-bold">
            Produit introuvable
          </h1>

          <p className="mt-4 text-gray">
            Cette pièce n'existe pas ou n'est plus disponible.
          </p>

          <Link
            to="/boutique"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Retour à la boutique
            <ArrowIcon />
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--novae-bg)]">
        <div className="py-24 text-center">
          <div className="text-sm font-bold uppercase tracking-widest text-accent">
            NOVAÉ
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            Chargement du produit...
          </h1>

          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const comparePrice = Number(product.compareAtPrice) || 0;

  const discount =
    comparePrice > price
      ? Math.round(100 - (price / comparePrice) * 100)
      : null;

  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;

  const increaseQuantity = () => {
    if (stock > 0 && quantity >= stock) {
      return;
    }

    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const confirmAdd = async () => {
    if (outOfStock) {
      return;
    }

    try {
      setStatus("loading");

      await add(
        product.id,
        quantity,
        size,
        color
      );

      setStatus("added");
      setShowAddConfirm(false);

      setTimeout(() => {
        setStatus("idle");
      }, 2500);
    } catch (error) {
      console.error(error);
      setStatus("error");

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--novae-bg)]">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">

        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-gray">
          <Link
            to="/boutique"
            className="hover:text-accent"
          >
            Boutique
          </Link>

          <span>/</span>

          <Link
            to={`/boutique?category=${encodeURIComponent(
              product.category || ""
            )}`}
            className="hover:text-accent"
          >
            {product.category || "Collection"}
          </Link>

          <span>/</span>

          <span className="font-semibold text-ink">
            {product.name}
          </span>
        </div>

        {/* Product */}
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Image */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border hairline bg-white shadow-sm">

              <ProductVisual
                image={product.image}
                className="h-full w-full"
              />

              <div className="absolute left-5 top-5 flex gap-2">
                {product.isNew && (
                  <span className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">
                    Nouveau
                  </span>
                )}

                {discount && (
                  <span className="rounded-full bg-sale px-4 py-2 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}
              </div>

              {product.ref && (
                <div className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow">
                  Réf. {product.ref}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="mt-4 grid grid-cols-3 gap-3">

              <div className="novae-card p-4">
                <div className="text-accent">
                  <CheckIcon />
                </div>

                <div className="mt-2 text-xs font-bold uppercase">
                  Qualité
                </div>

                <p className="mt-1 text-xs text-gray">
                  Sélection NOVAÉ
                </p>
              </div>

              <div className="novae-card p-4">
                <div className="text-accent">
                  <CheckIcon />
                </div>

                <div className="mt-2 text-xs font-bold uppercase">
                  Vérifié
                </div>

                <p className="mt-1 text-xs text-gray">
                  Produit contrôlé
                </p>
              </div>

              <div className="novae-card p-4">
                <div className="text-accent">
                  <CheckIcon />
                </div>

                <div className="mt-2 text-xs font-bold uppercase">
                  Service
                </div>

                <p className="mt-1 text-xs text-gray">
                  Assistance disponible
                </p>
              </div>

            </div>
          </div>

          {/* Informations produit */}
          <div className="lg:pt-4">

            {/* Catégorie */}
            <div className="text-xs font-bold uppercase tracking-widest text-accent">
              {product.subcategory || product.category || "Collection"}
            </div>

            {/* Nom */}
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {product.name}
            </h1>

            {/* Note */}
            <div className="mt-5 flex items-center gap-3">
              <Stars rating={product.rating} />

              <span className="text-sm font-semibold">
                {product.rating || "—"}
              </span>

              <span className="text-sm text-gray">
                ({product.reviewCount || 0} avis)
              </span>
            </div>

            {/* Prix */}
            <div className="mt-6 flex flex-wrap items-center gap-3">

              <span
                className={`text-3xl font-extrabold ${
                  discount ? "text-sale" : "text-ink"
                }`}
              >
                {price.toLocaleString("fr-FR")} €
              </span>

              {comparePrice > price && (
                <span className="text-base text-gray line-through">
                  {comparePrice.toLocaleString("fr-FR")} €
                </span>
              )}

              {discount && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-sale">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6 border-b hairline pb-6">
                <p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-gray">
                  {product.description}
                </p>
              </div>
            )}

            {/* Couleurs */}
            {product.colors?.length > 0 && (
              <div className="mt-7">

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Coloris
                  </span>

                  <span className="text-sm text-gray">
                    {color}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {product.colors.map((item) => (
                    <button
                      key={item}
                      type="button"
                      title={item}
                      onClick={() => setColor(item)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                        color === item
                          ? "scale-110 border-accent shadow"
                          : "border-line hover:border-accent"
                      }`}
                      style={{
                        backgroundColor: colorToHex(item),
                      }}
                    >
                      {color === item && (
                        <span className="text-white">
                          <CheckIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tailles */}
            {product.sizes?.length > 0 && (
              <div className="mt-7">

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Taille
                  </span>

                  <span className="text-sm text-gray">
                    {size}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSize(item)}
                      className={`min-w-[52px] rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        size === item
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white hover:border-accent hover:text-accent"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mt-7">

              {outOfStock ? (
                <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-sale">
                  ● Rupture de stock
                </div>
              ) : stock <= 15 ? (
                <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-accent">
                  ● Plus que {stock} disponible{stock > 1 ? "s" : ""}
                </div>
              ) : (
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-success">
                  ● En stock
                </div>
              )}
            </div>

            {/* Panier */}
            <div className="mt-6 rounded-2xl border hairline bg-white p-4 shadow-sm">

              <div className="flex gap-3">

                {/* Quantité */}
                <div className="flex h-14 items-center rounded-xl border hairline bg-[var(--novae-bg)]">

                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || outOfStock}
                    className="flex h-full w-11 items-center justify-center hover:bg-white disabled:opacity-40"
                  >
                    <MinusIcon />
                  </button>

                  <span className="w-10 text-center font-bold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      outOfStock ||
                      (stock > 0 && quantity >= stock)
                    }
                    className="flex h-full w-11 items-center justify-center hover:bg-white disabled:opacity-40"
                  >
                    <PlusIcon />
                  </button>

                </div>

                {/* Ajouter */}
                <button
                  type="button"
                  disabled={status === "loading" || outOfStock}
                  onClick={() => setShowAddConfirm(true)}
                  className="flex-1 rounded-xl bg-accent px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "loading"
                    ? "Ajout en cours..."
                    : status === "added"
                    ? "Ajouté au panier ✓"
                    : outOfStock
                    ? "Indisponible"
                    : "Ajouter au panier"}
                </button>

              </div>

              {status === "added" && (
                <div className="mt-4 flex items-center justify-between border-t hairline pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-success">
                    <CheckIcon />
                    Produit ajouté au panier.
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/panier")}
                    className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary-dark"
                  >
                    Voir le panier
                    <ArrowIcon />
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="mt-4 text-sm font-semibold text-sale">
                  Une erreur est survenue. Veuillez réessayer.
                </div>
              )}
            </div>

            {/* Services */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <div className="novae-card p-4">
                <div className="text-xs font-bold uppercase">
                  Livraison
                </div>

                <p className="mt-2 text-xs text-gray">
                  Livraison offerte dès 150 €.
                </p>
              </div>

              <div className="novae-card p-4">
                <div className="text-xs font-bold uppercase">
                  Retours
                </div>

                <p className="mt-2 text-xs text-gray">
                  Retour possible sous 30 jours.
                </p>
              </div>

              <div className="novae-card p-4">
                <div className="text-xs font-bold uppercase">
                  Paiement
                </div>

                <p className="mt-2 text-xs text-gray">
                  Paiement sécurisé.
                </p>
              </div>

            </div>

            {/* Détails */}
            {product.details?.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-2xl border hairline bg-white">

                <div className="border-b hairline px-5 py-4">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Détails du produit
                  </div>
                </div>

                <div className="p-5">
                  <ul className="space-y-3">
                    {product.details.map((detail, index) => (
                      <li
                        key={`${detail}-${index}`}
                        className="flex items-start gap-3 text-sm text-gray"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Retour */}
        <div className="mt-12 border-t hairline pt-6">
          <Link
            to="/boutique"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray hover:text-accent"
          >
            ← Continuer mes achats
          </Link>
        </div>

      </div>

      {/* Confirmation */}
      <ConfirmDialog
        open={showAddConfirm}
        title="Ajouter au panier ?"
        message={`« ${product.name} » sera ajouté à votre panier.`}
        confirmLabel="Ajouter"
        loading={status === "loading"}
        onConfirm={confirmAdd}
        onCancel={() => setShowAddConfirm(false)}
      />
    </main>
  );
}