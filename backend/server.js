import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { seedIfEmpty } from "./db/seed.js";

import productsRouter from "./routes/products.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";

seedIfEmpty();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// Fichiers statiques
// -----------------------------------------------------------------------------
// Les photos des produits seront accessibles via :
// http://localhost:4000/uploads/products/nom-du-fichier.jpg

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "luxe-backend",
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route introuvable",
  });
});

app.listen(PORT, () => {
  console.log(
    `Luxe API démarrée sur http://localhost:${PORT}`
  );
});
