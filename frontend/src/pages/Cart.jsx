import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import ProductVisual from "../components/ProductVisual.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function Cart() {
  const { cart, updateQuantity, remove, loading } = useCart();
  const navigate = useNavigate();

  const [confirmItem, setConfirmItem] = useState(null);
  const [removing, setRemoving] = useState(false);

  const confirmRemove = async () => {
    if (!confirmItem) return;

    setRemoving(true);

    try {
      await remove(confirmItem.index);
      setConfirmItem(null);
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-24">
        <div className="flex items-center justify-center gap-3 text-sm text-gray">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-accent animate-spin" />
          Chargement du panier…
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-20 md:py-32">
        <div className="max-w-xl mx-auto text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8h12l1 12H5L6 8Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
          </div>

          <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold mb-3">
            NOVAÉ / Panier
          </div>

          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tightest">
            Votre panier est vide
          </h1>

          <p className="text-gray text-sm mt-4 leading-6">
            Composez votre sélection parmi nos pièces disponibles et
            découvrez les nouveautés NOVAÉ.
          </p>

          <Link
            to="/boutique"
            className="inline-flex items-center justify-center gap-3 mt-8 bg-accent text-white px-7 py-3.5 rounded-xl text-xs uppercase tracking-widest2 font-bold hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all"
          >
            Découvrir la collection
            <ArrowIcon />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-10 md:py-14">
      {/* HEADER */}
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold mb-3">
          NOVAÉ / Panier
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tightest">
              Votre panier
            </h1>

            <p className="text-sm text-gray mt-3">
              {cart.items.length} article
              {cart.items.length > 1 ? "s" : ""} dans votre sélection
            </p>
          </div>

          <Link
            to="/boutique"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest2 font-bold text-accent hover:text-blue-700 transition-colors"
          >
            Continuer mes achats
            <ArrowIcon />
          </Link>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 xl:gap-12 transition-all duration-200 ${
          confirmItem
            ? "blur-sm pointer-events-none select-none"
            : ""
        }`}
      >
        {/* PRODUITS */}
        <section>
          <div className="novae-card overflow-hidden">
            <div className="px-5 md:px-7 py-4 border-b hairline bg-paper">
              <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                Articles sélectionnés
              </div>
            </div>

            <div className="divide-y hairline">
              {cart.items.map((item) => (
                <div
                  key={item.index}
                  className="p-5 md:p-7 flex flex-col sm:flex-row gap-5"
                >
                  {/* IMAGE */}
                  <Link
                    to={`/produit/${item.product?.id}`}
                    className="w-full sm:w-28 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-line block"
                  >
                    <ProductVisual
                      image={item.product?.image}
                      className="w-full h-full"
                    />
                  </Link>

                  {/* INFORMATIONS */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-widest2 text-gray mb-1.5">
                          {item.product?.subcategory ||
                            item.product?.category ||
                            "NOVAÉ"}
                        </div>

                        <Link
                          to={`/produit/${item.product?.id}`}
                          className="font-display font-bold text-base md:text-lg hover:text-accent transition-colors"
                        >
                          {item.product?.name}
                        </Link>

                        {(item.color || item.size) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.color && (
                              <span className="inline-flex items-center rounded-full bg-slate-50 border border-line px-2.5 py-1 text-[11px] text-gray">
                                Couleur : {item.color}
                              </span>
                            )}

                            {item.size && (
                              <span className="inline-flex items-center rounded-full bg-slate-50 border border-line px-2.5 py-1 text-[11px] text-gray">
                                Taille : {item.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-base font-bold whitespace-nowrap">
                        {item.lineTotal.toLocaleString("fr-FR")} €
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                      {/* QUANTITE */}
                      <div>
                        <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold mb-2">
                          Quantité
                        </div>

                        <div className="inline-flex items-center rounded-xl border border-line bg-paper overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.index,
                                item.quantity - 1
                              )
                            }
                            className="w-10 h-10 flex items-center justify-center text-gray hover:bg-accent-soft hover:text-accent transition-colors"
                            aria-label="Diminuer la quantité"
                          >
                            <MinusIcon />
                          </button>

                          <span className="w-11 h-10 flex items-center justify-center border-x border-line text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.index,
                                item.quantity + 1
                              )
                            }
                            className="w-10 h-10 flex items-center justify-center text-gray hover:bg-accent-soft hover:text-accent transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <PlusIcon />
                          </button>
                        </div>
                      </div>

                      {/* RETIRER */}
                      <button
                        type="button"
                        onClick={() => setConfirmItem(item)}
                        className="inline-flex items-center justify-center gap-2 self-start sm:self-end rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                      >
                        <TrashIcon />
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="text-accent mb-2">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M3 7h11v10H3z" />
                  <path d="M14 10h4l3 3v4h-7z" />
                  <circle cx="7" cy="19" r="1.5" />
                  <circle cx="18" cy="19" r="1.5" />
                </svg>
              </div>
              <div className="text-xs font-bold">Livraison offerte</div>
              <div className="text-[11px] text-gray mt-1">
                Sur votre commande
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="text-accent mb-2">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M20 11a8 8 0 1 0 2 5" />
                  <path d="M20 4v7h-7" />
                </svg>
              </div>
              <div className="text-xs font-bold">Retours simples</div>
              <div className="text-[11px] text-gray mt-1">
                Service après-vente NOVAÉ
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="text-accent mb-2">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <div className="text-xs font-bold">Paiement sécurisé</div>
              <div className="text-[11px] text-gray mt-1">
                Vos informations sont protégées
              </div>
            </div>
          </div>
        </section>

        {/* RECAPITULATIF */}
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="novae-card overflow-hidden">
            <div className="px-6 py-5 border-b hairline">
              <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                Récapitulatif
              </div>

              <div className="font-display font-bold text-xl mt-2">
                Votre commande
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray">Sous-total</span>
                <span className="font-semibold">
                  {cart.subtotal.toLocaleString("fr-FR")} €
                </span>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <span className="text-gray">Livraison</span>
                <span className="font-semibold text-green-600">
                  Offerte
                </span>
              </div>

              <div className="border-t hairline pt-5">
                <div className="flex justify-between items-end gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                      Total
                    </div>
                    <div className="text-[11px] text-gray mt-1">
                      Toutes taxes incluses
                    </div>
                  </div>

                  <div className="font-display font-extrabold text-2xl">
                    {cart.subtotal.toLocaleString("fr-FR")} €
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/commande")}
                className="w-full mt-7 inline-flex items-center justify-center gap-3 bg-accent text-white py-4 px-5 rounded-xl text-xs uppercase tracking-widest2 font-bold hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all"
              >
                Passer la commande
                <ArrowIcon />
              </button>

              <Link
                to="/boutique"
                className="w-full mt-3 inline-flex items-center justify-center border border-line bg-paper text-ink py-3.5 px-5 rounded-xl text-xs uppercase tracking-widest2 font-bold hover:border-accent hover:text-accent transition-all"
              >
                Continuer mes achats
              </Link>

              <div className="mt-6 rounded-xl bg-accent-soft border border-blue-100 p-4">
                <div className="flex gap-3">
                  <div className="text-accent mt-0.5">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5" />
                      <path d="M12 8h.01" />
                    </svg>
                  </div>

                  <p className="text-[11px] leading-5 text-slate-600">
                    Les frais de livraison sont actuellement offerts
                    sur votre commande.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* CONFIRMATION */}
      <ConfirmDialog
        open={!!confirmItem}
        title="Retirer cet article ?"
        message={
          confirmItem
            ? `« ${confirmItem.product?.name} » sera retiré de votre panier.`
            : ""
        }
        confirmLabel="Retirer"
        danger
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}