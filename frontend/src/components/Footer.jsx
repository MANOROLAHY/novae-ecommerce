import React from "react";
import { Link } from "react-router-dom";

const TRUST = [
  ["01", "Livraison offerte", "Dès 150 €"],
  ["02", "Retours simples", "Sous 30 jours"],
  ["03", "Paiement sécurisé", "100 % protégé"],
  ["04", "Service client", "Réponse sous 24 h"],
];

export default function Footer() {
  return <footer className="mt-24">
    <div className="border-y hairline bg-cream">
      <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {TRUST.map(([n,t,b]) => <div key={n} className="flex gap-3"><span className="text-[10px] text-accent font-bold">{n}</span><div><div className="font-semibold text-sm">{t}</div><div className="text-xs text-gray mt-1">{b}</div></div></div>)}
      </div>
    </div>
    <div className="bg-ink text-paper">
      <div className="mx-auto max-w-[1500px] px-5 md:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div><div className="font-display font-extrabold text-2xl tracking-[-.06em]">NOVAÉ</div><p className="text-sm text-paper/55 leading-relaxed mt-4 max-w-xs">Une boutique moderne dédiée aux pièces que l'on garde, utilise et aime longtemps.</p></div>
        <div><div className="text-[10px] uppercase tracking-widest2 text-paper/40 mb-4">Explorer</div><div className="grid gap-2.5 text-sm text-paper/75"><Link to="/boutique">Toute la boutique</Link><Link to="/boutique?isNew=true">Nouveautés</Link><Link to="/boutique?category=Mode">Mode</Link><Link to="/boutique?category=Électronique">Tech</Link></div></div>
        <div><div className="text-[10px] uppercase tracking-widest2 text-paper/40 mb-4">Aide</div><div className="grid gap-2.5 text-sm text-paper/75"><span>Livraison & retours</span><span>Suivre une commande</span><span>Contact</span></div></div>
        <div><div className="text-[10px] uppercase tracking-widest2 text-paper/40 mb-4">Journal NOVAÉ</div><p className="text-sm text-paper/55 mb-4">Recevez nos nouveautés et sélections privées.</p><div className="flex border border-paper/20 rounded-xl overflow-hidden"><input placeholder="Votre e-mail" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"/><button className="px-4 text-[10px] uppercase tracking-widest2 font-bold">OK</button></div></div>
      </div>
      <div className="border-t border-paper/10 py-5"><div className="mx-auto max-w-[1500px] px-5 md:px-8 flex flex-col sm:flex-row justify-between gap-3 text-[10px] uppercase tracking-widest2 text-paper/35"><span>© 2026 NOVAÉ</span><Link to="/admin">Administration</Link></div></div>
    </div>
  </footer>;
}
