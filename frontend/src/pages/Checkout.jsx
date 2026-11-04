import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { placeOrder } from "../context/api.js";

const initialForm = {
  name: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "France",
};

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-slate-600 font-bold mb-2">
        {icon && <span className="text-accent">{icon}</span>}
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm text-ink placeholder:text-slate-400 shadow-sm transition-all outline-none focus:border-accent focus:ring-4 focus:ring-blue-50 hover:border-slate-300"
      />
    </label>
  );
}

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
            >
              <path d="M6 8h12l1 12H5L6 8Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
          </div>

          <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold mb-3">
            NOVAÉ / Commande
          </div>

          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tightest">
            Votre panier est vide
          </h1>

          <p className="text-sm text-gray mt-4">
            Ajoutez des articles avant de passer votre commande.
          </p>

          <Link
            to="/boutique"
            className="inline-flex items-center justify-center gap-3 mt-8 bg-accent text-white px-7 py-3.5 rounded-xl text-xs uppercase tracking-widest2 font-bold hover:bg-blue-700 transition-all"
          >
            Retour à la boutique
            <ArrowIcon />
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const order = await placeOrder(form);

      await refresh();

      navigate(`/confirmation/${order.id}`);
    } catch (err) {
      setError(
        err.message ||
          "Une erreur est survenue lors de la confirmation de la commande."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-10 md:py-14">
      {/* HEADER */}
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold mb-3">
          NOVAÉ / Commande
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tightest">
              Finaliser la commande
            </h1>

            <p className="text-sm text-gray mt-3">
              Renseignez vos coordonnées pour confirmer votre commande.
            </p>
          </div>

          <Link
            to="/panier"
            className="text-xs uppercase tracking-widest2 font-bold text-accent hover:text-blue-700 transition-colors"
          >
            ← Retour au panier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 xl:gap-12">
        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* COORDONNEES */}
          <section className="novae-card overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b hairline bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <UserIcon />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                    Étape 01
                  </div>

                  <h2 className="font-display font-bold text-lg mt-0.5">
                    Vos coordonnées
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Nom complet"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  placeholder="Votre nom complet"
                  icon={<UserIcon />}
                />

                <Field
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  placeholder="exemple@email.com"
                  icon={<MailIcon />}
                />
              </div>
            </div>
          </section>

          {/* LIVRAISON */}
          <section className="novae-card overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b hairline bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <LocationIcon />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                    Étape 02
                  </div>

                  <h2 className="font-display font-bold text-lg mt-0.5">
                    Adresse de livraison
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <Field
                label="Adresse"
                value={form.address}
                onChange={handleChange("address")}
                required
                placeholder="Numéro et nom de rue"
                icon={<LocationIcon />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field
                  label="Ville"
                  value={form.city}
                  onChange={handleChange("city")}
                  required
                  placeholder="Votre ville"
                />

                <Field
                  label="Code postal"
                  value={form.postalCode}
                  onChange={handleChange("postalCode")}
                  required
                  placeholder="75000"
                />

                <Field
                  label="Pays"
                  value={form.country}
                  onChange={handleChange("country")}
                  required
                  placeholder="France"
                />
              </div>
            </div>
          </section>

          {/* PAIEMENT */}
          <section className="novae-card overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b hairline bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <ShieldIcon />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                    Étape 03
                  </div>

                  <h2 className="font-display font-bold text-lg mt-0.5">
                    Paiement
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white text-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ShieldIcon />
                  </div>

                  <div>
                    <div className="font-bold text-sm">
                      Paiement sécurisé
                    </div>

                    <p className="text-xs text-slate-600 leading-5 mt-1">
                      Ce prototype ne traite aucun paiement réel. La
                      commande sera directement confirmée pour la
                      démonstration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ERREUR */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <div className="font-bold mb-1">
                Impossible de confirmer la commande
              </div>
              <div>{error}</div>
            </div>
          )}

          {/* BOUTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-3 bg-accent text-white py-4 px-6 rounded-xl text-xs uppercase tracking-widest2 font-bold hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Confirmation en cours…
              </>
            ) : (
              <>
                Confirmer la commande
                <ArrowIcon />
              </>
            )}
          </button>
        </form>

        {/* RECAPITULATIF */}
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="novae-card overflow-hidden">
            <div className="px-6 py-5 border-b hairline">
              <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                Récapitulatif
              </div>

              <h2 className="font-display font-bold text-xl mt-2">
                Votre commande
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {cart.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {item.product?.name}
                      </div>

                      <div className="text-xs text-gray mt-1">
                        Quantité : {item.quantity}
                      </div>

                      {item.color && (
                        <div className="text-[11px] text-gray mt-1">
                          Couleur : {item.color}
                        </div>
                      )}

                      {item.size && (
                        <div className="text-[11px] text-gray mt-0.5">
                          Taille : {item.size}
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-bold whitespace-nowrap">
                      {item.lineTotal.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t hairline mt-6 pt-5">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray">Sous-total</span>
                  <span className="font-semibold">
                    {cart.subtotal.toLocaleString("fr-FR")} €
                  </span>
                </div>

                <div className="flex justify-between text-sm mb-5">
                  <span className="text-gray">Livraison</span>
                  <span className="font-semibold text-green-600">
                    Offerte
                  </span>
                </div>

                <div className="flex justify-between items-end gap-4 border-t hairline pt-5">
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

              <div className="mt-6 rounded-xl bg-slate-50 border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-600 mt-0.5">
                    <ShieldIcon />
                  </div>

                  <div>
                    <div className="text-xs font-bold">
                      Commande sécurisée
                    </div>

                    <p className="text-[11px] text-gray leading-5 mt-1">
                      Vos informations sont utilisées uniquement pour
                      traiter votre commande.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}