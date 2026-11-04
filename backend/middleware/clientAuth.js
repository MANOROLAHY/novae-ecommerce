import { db } from "../db/database.js";

export function getTokenFromRequest(req) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export function getUserFromToken(token) {
  if (!token) return null;

  return db
    .prepare(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.created_at
       FROM client_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) || null;
}

export function requireClient(req, res, next) {
  const token = getTokenFromRequest(req);
  const user = getUserFromToken(token);

  if (!user) {
    return res.status(401).json({
      error: "Authentification client requise",
    });
  }

  req.user = user;
  req.clientToken = token;

  next();
}
