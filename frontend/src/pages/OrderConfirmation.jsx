import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AtelierTag from "../components/AtelierTag.jsx";

export default function OrderConfirmation() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("novae_token");

        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/orders/${id}`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Impossible de récupérer la commande"
          );
        }

        setOrder(data);
      } catch (err) {
        console.error("Erreur récupération commande :", err);

        setError(
          err.message || "Impossible de récupérer cette commande."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-24 text-center">
        <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
          Chargement de votre commande...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold">
          NOVAÉ / Commande
        </div>

        <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tightest mt-3">
          Impossible d'afficher la commande
        </h1>

        <p className="text-gray text-sm leading-relaxed mt-4">
          {error}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Link
            to="/compte"
            className="inline-flex justify-center rounded-full bg-ink text-paper px-6 py-3.5 text-[10px] uppercase tracking-widest2 font-bold"
          >
            Mon compte
          </Link>

          <Link
            to="/boutique"
            className="inline-flex justify-center rounded-full border hairline px-6 py-3.5 text-[10px] uppercase tracking-widest2 font-bold hover:bg-cream transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="flex justify-center mb-6">
        <AtelierTag reference={order.reference} />
      </div>

      <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold mb-3">
        NOVAÉ / Merci
      </div>

      <h1 className="font-display font-bold text-3xl tracking-tightest mb-4 uppercase">
        Commande confirmée
      </h1>

      <p className="text-gray mb-10 max-w-md mx-auto text-sm">
        Merci, {order.customer.name}. Votre commande a bien été enregistrée
        et sera préparée avec soin par notre atelier.
      </p>

      <div className="bg-surface text-left p-6 mb-10">
        <div className="flex justify-between items-center mb-5 pb-4 border-b hairline">
          <div>
            <div className="text-[9px] uppercase tracking-widest2 text-gray font-bold">
              Référence
            </div>

            <div className="font-display font-bold mt-1">
              {order.reference}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest2 text-gray font-bold">
              Statut
            </div>

            <div className="text-xs font-semibold mt-1 uppercase">
              {order.status}
            </div>
          </div>
        </div>

        <div className="divide-y hairline">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="py-3 flex justify-between gap-5 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>

              <span className="font-medium whitespace-nowrap">
                {(item.price * item.quantity).toLocaleString("fr-FR")} €
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-semibold text-base border-t hairline pt-4 mt-2">
          <span>Total réglé</span>

          <span>
            {order.total.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          to="/compte"
          className="inline-flex justify-center items-center bg-ink text-white px-7 py-3.5 rounded-full text-xs uppercase tracking-widest2 font-semibold hover:opacity-90 transition-opacity"
        >
          Voir mon compte
        </Link>

        <Link
          to="/boutique"
          className="inline-flex justify-center items-center border hairline px-7 py-3.5 rounded-full text-xs uppercase tracking-widest2 font-semibold hover:bg-cream transition-colors"
        >
          Poursuivre mes achats
        </Link>
      </div>
    </div>
  );
}
