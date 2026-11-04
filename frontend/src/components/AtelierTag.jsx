import React from "react";

// Conservé pour compatibilité (référence produit / commande), redesigné
// dans l'esprit "badge commercial" plutôt qu'étiquette d'atelier.
export default function AtelierTag({ reference, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-ink text-white text-[11px] font-semibold px-3 py-1.5 rounded ${className}`}>
      <span>{reference}</span>
    </div>
  );
}
