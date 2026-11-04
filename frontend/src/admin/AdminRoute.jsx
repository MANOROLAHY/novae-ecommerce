import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../context/api.js";

// Redirige vers la page de connexion si aucun token admin n'est présent.
// Note pédagogique : cette vérification côté frontend n'est qu'un confort
// d'affichage — la vraie protection se fait côté serveur (requireAdmin dans
// le backend), qui refuse toute écriture sans token valide, quoi que fasse
// l'interface.
export default function AdminRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/connexion" replace />;
  }
  return children;
}
