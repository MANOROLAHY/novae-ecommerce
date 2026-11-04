import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { ADMIN_PASSWORD } from "../config.js";

// Les sessions admin sont stockées dans la base de données (table
// admin_sessions) plutôt qu'en mémoire : elles survivent donc aux
// redémarrages du serveur, et n'expirent jamais tant que l'administrateur
// ne se déconnecte pas explicitement (bouton "Déconnexion").
//
// Note pour une vraie mise en production : des sessions qui ne expirent
// jamais sont un compromis de confort pour ce prototype. Idéalement, on
// ajouterait une expiration longue (ex: 30 jours) et un renouvellement
// automatique à chaque usage, pour limiter les risques si un jeton fuite.

export function login(password) {
  if (password !== ADMIN_PASSWORD) return null;
  const token = uuidv4();
  db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token);
  return token;
}

export function isValidToken(token) {
  if (!token) return false;
  const row = db.prepare("SELECT token FROM admin_sessions WHERE token = ?").get(token);
  return !!row;
}

export function logoutToken(token) {
  if (!token) return;
  db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
}

// Middleware Express : bloque la requête si le token admin est absent ou
// invalide. À placer devant toute route réservée à l'administrateur.
export function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!isValidToken(token)) {
    return res.status(401).json({ error: "Authentification administrateur requise" });
  }
  next();
}
