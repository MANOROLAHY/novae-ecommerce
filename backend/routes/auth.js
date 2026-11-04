import { Router } from "express";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { db } from "../db/database.js";
import {
  getTokenFromRequest,
  getUserFromToken,
} from "../middleware/clientAuth.js";

const router = Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    password,
    salt,
    64
  ).toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");

  if (!salt || !hash) {
    return false;
  }

  const derivedHash = scryptSync(
    password,
    salt,
    64
  );

  const storedBuffer = Buffer.from(hash, "hex");

  if (derivedHash.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(
    derivedHash,
    storedBuffer
  );
}

function createSession(userId) {
  const token = randomBytes(48).toString("hex");

  db.prepare(
    `INSERT INTO client_sessions (token, user_id)
     VALUES (?, ?)`
  ).run(token, userId);

  return token;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

// -----------------------------------------------------------------------------
// POST /api/auth/register
// -----------------------------------------------------------------------------

router.post("/register", (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (name.length < 2) {
      return res.status(400).json({
        error: "Le nom doit contenir au moins 2 caractères",
      });
    }

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        error: "Adresse email invalide",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return res.status(409).json({
        error: "Un compte existe déjà avec cette adresse email",
      });
    }

    const userId = randomUUID();
    const passwordHash = hashPassword(password);

    db.prepare(
      `INSERT INTO users
        (id, name, email, password_hash)
       VALUES (?, ?, ?, ?)`
    ).run(
      userId,
      name,
      email,
      passwordHash
    );

    const user = db
      .prepare(
        `SELECT id, name, email, created_at
         FROM users
         WHERE id = ?`
      )
      .get(userId);

    const token = createSession(userId);

    return res.status(201).json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Erreur inscription :", error);

    return res.status(500).json({
      error: "Impossible de créer le compte",
    });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------

router.post("/login", (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    const user = db
      .prepare(
        `SELECT
          id,
          name,
          email,
          password_hash,
          created_at
         FROM users
         WHERE email = ?`
      )
      .get(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const token = createSession(user.id);

    return res.json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      error: "Impossible de se connecter",
    });
  }
});

// -----------------------------------------------------------------------------
// GET /api/auth/me
// -----------------------------------------------------------------------------

router.get("/me", (req, res) => {
  const token = getTokenFromRequest(req);
  const user = getUserFromToken(token);

  if (!user) {
    return res.status(401).json({
      error: "Session invalide ou expirée",
    });
  }

  res.json({
    user: publicUser(user),
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout
// -----------------------------------------------------------------------------

router.post("/logout", (req, res) => {
  const token = getTokenFromRequest(req);

  if (token) {
    db.prepare(
      "DELETE FROM client_sessions WHERE token = ?"
    ).run(token);
  }

  res.json({
    message: "Déconnexion réussie",
  });
});

export default router;
