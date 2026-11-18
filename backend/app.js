import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import productsRouter from "./routes/products.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Fichiers statiques des produits
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes API
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

// Vérification de l'état du serveur
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "luxe-backend",
  });
});

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({
    error: "Route introuvable",
  });
});

// Gestion globale des erreurs
app.use((err, _req, res, _next) => {
  console.error("Erreur interne du serveur :", err);

  const status = Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 500
    ? err.status
    : 500;

  return res.status(status).json({
    error:
      status === 500
        ? "Une erreur interne est survenue."
        : err.message || "Requête invalide.",
  });
});

export default app;
