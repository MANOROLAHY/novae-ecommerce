import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-32 text-center">
      <div className="font-display font-bold text-7xl text-accent mb-4 tracking-tightest">404</div>
      <h1 className="font-display font-bold text-xl tracking-tightest mb-4 uppercase">Cette page n'existe pas.</h1>
      <p className="text-gray mb-8 text-sm">La pièce que vous cherchez n'est plus dans notre atelier.</p>
      <Link to="/" className="text-accent font-semibold underline">Retour à l'accueil</Link>
    </div>
  );
}
