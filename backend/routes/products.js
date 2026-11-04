import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";

import { db } from "../db/database.js";
import { rowToProduct } from "../db/mappers.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

/* =========================================================
   CONFIGURATION UPLOAD DES IMAGES PRODUITS
   ========================================================= */

const uploadDir = path.resolve("uploads/products");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Mo maximum
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Format image non autorisé. Utilisez JPG, PNG ou WEBP.")
      );
    }

    cb(null, true);
  },
});

/* =========================================================
   GET - LISTE DES PRODUITS
   ========================================================= */

// GET /api/products?category=Mode&subcategory=Chaussures&search=cuir&sort=price_asc&featured=true
router.get("/", (req, res) => {
  const { category, subcategory, search, sort, featured, isNew } = req.query;

  let sql = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (category) {
    sql += " AND LOWER(category) = LOWER(?)";
    params.push(category);
  }

  if (subcategory) {
    sql += " AND LOWER(subcategory) = LOWER(?)";
    params.push(subcategory);
  }

  if (search) {
    sql +=
      " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)";

    const q = `%${search.toLowerCase()}%`;
    params.push(q, q, q);
  }

  if (featured === "true") {
    sql += " AND featured = 1";
  }

  if (isNew === "true") {
    sql += " AND is_new = 1";
  }

  if (sort === "price_asc") {
    sql += " ORDER BY price ASC";
  } else if (sort === "price_desc") {
    sql += " ORDER BY price DESC";
  } else if (sort === "name") {
    sql += " ORDER BY name ASC";
  }

  const rows = db.prepare(sql).all(...params);

  res.json(rows.map(rowToProduct));
});

/* =========================================================
   GET - CATÉGORIES
   ========================================================= */

router.get("/categories", (req, res) => {
  const rows = db
    .prepare("SELECT DISTINCT category, subcategory FROM products")
    .all();

  const map = {};

  rows.forEach((r) => {
    if (!map[r.category]) {
      map[r.category] = new Set();
    }

    map[r.category].add(r.subcategory);
  });

  const categories = Object.entries(map).map(([category, subs]) => ({
    category,
    subcategories: Array.from(subs),
  }));

  res.json(categories);
});

/* =========================================================
   GET - PRODUIT PAR ID
   ========================================================= */

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({
      error: "Produit introuvable",
    });
  }

  res.json(rowToProduct(row));
});

/* =========================================================
   POST - CRÉER UN PRODUIT
   ========================================================= */

router.post("/", requireAdmin, (req, res) => {
  const b = req.body;

  if (!b.name || !b.category || !b.subcategory || !b.price) {
    return res.status(400).json({
      error:
        "Nom, catégorie, sous-catégorie et prix sont obligatoires",
    });
  }

  const id = b.id || uuidv4();

  db.prepare(
    `INSERT INTO products
      (
        id,
        ref,
        name,
        category,
        subcategory,
        price,
        currency,
        description,
        details,
        colors,
        sizes,
        stock,
        image,
        featured,
        is_new,
        rating,
        review_count,
        compare_at_price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    b.ref || id,
    b.name,
    b.category,
    b.subcategory,
    b.price,
    b.currency || "EUR",
    b.description || "",
    JSON.stringify(b.details || []),
    JSON.stringify(b.colors || []),
    JSON.stringify(b.sizes || []),
    b.stock ?? 0,
    b.image || "bag",
    b.featured ? 1 : 0,
    b.isNew ? 1 : 0,
    b.rating ?? null,
    b.reviewCount ?? 0,
    b.compareAtPrice ?? null
  );

  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(id);

  res.status(201).json(rowToProduct(row));
});

/* =========================================================
   POST - UPLOAD PHOTO D'UN PRODUIT
   ========================================================= */

router.post(
  "/:id/image",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);

    if (!product) {
      // Si le produit n'existe pas, supprimer le fichier
      // qui vient éventuellement d'être envoyé.
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(404).json({
        error: "Produit introuvable",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Aucune image envoyée",
      });
    }

    /*
     * Supprimer l'ancienne vraie image si elle existe.
     *
     * Les anciennes valeurs comme "bag", "coat", "shoes"
     * ne sont pas des fichiers et seront donc ignorées.
     */
    if (product.image && product.image.startsWith("/uploads/products/")) {
      const oldFilename = path.basename(product.image);
      const oldPath = path.join(uploadDir, oldFilename);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const imagePath = `/uploads/products/${req.file.filename}`;

    db.prepare(
      "UPDATE products SET image = ? WHERE id = ?"
    ).run(imagePath, req.params.id);

    const updatedRow = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);

    res.json({
      success: true,
      message: "Image du produit ajoutée avec succès",
      product: rowToProduct(updatedRow),
    });
  }
);

/* =========================================================
   PUT - MODIFIER UN PRODUIT
   ========================================================= */

router.put("/:id", requireAdmin, (req, res) => {
  const existing = db
    .prepare("SELECT id FROM products WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({
      error: "Produit introuvable",
    });
  }

  const b = req.body;

  db.prepare(
    `UPDATE products SET
      ref = ?,
      name = ?,
      category = ?,
      subcategory = ?,
      price = ?,
      currency = ?,
      description = ?,
      details = ?,
      colors = ?,
      sizes = ?,
      stock = ?,
      image = ?,
      featured = ?,
      is_new = ?,
      rating = ?,
      review_count = ?,
      compare_at_price = ?
     WHERE id = ?`
  ).run(
    b.ref,
    b.name,
    b.category,
    b.subcategory,
    b.price,
    b.currency || "EUR",
    b.description || "",
    JSON.stringify(b.details || []),
    JSON.stringify(b.colors || []),
    JSON.stringify(b.sizes || []),
    b.stock ?? 0,
    b.image || "bag",
    b.featured ? 1 : 0,
    b.isNew ? 1 : 0,
    b.rating ?? null,
    b.reviewCount ?? 0,
    b.compareAtPrice ?? null,
    req.params.id
  );

  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  res.json(rowToProduct(row));
});

/* =========================================================
   DELETE - SUPPRIMER UN PRODUIT
   ========================================================= */

router.delete("/:id", requireAdmin, (req, res) => {
  const productId = req.params.id;

  try {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(productId);

    if (!product) {
      return res.status(404).json({
        error: "Produit introuvable",
      });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(productId);

    return res.json({
      message: "Produit supprimé avec succès",
      id: productId,
    });
  } catch (error) {
    console.error("Erreur suppression produit :", error);

    return res.status(500).json({
      error: "Impossible de supprimer le produit",
    });
  }
});
/* =========================================================
   GESTION DES ERREURS MULTER
   ========================================================= */

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "L'image est trop grande. Taille maximale : 5 Mo.",
      });
    }

    return res.status(400).json({
      error: `Erreur upload : ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Erreur lors de l'upload de l'image",
    });
  }
});

export default router;
