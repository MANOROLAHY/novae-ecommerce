import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";

const router = Router();

function getOrCreateCartId(req) {
  const headerId = req.headers["x-cart-id"];
  if (headerId) {
    const existing = db.prepare("SELECT id FROM carts WHERE id = ?").get(headerId);
    if (existing) return existing.id;
  }
  const id = uuidv4();
  db.prepare("INSERT INTO carts (id) VALUES (?)").run(id);
  return id;
}

// Reconstruit le panier "enrichi" (avec les infos produit et les totaux) à
// partir des lignes en base — l'équivalent d'une jointure SQL faite ici en
// deux requêtes simples pour rester lisible.
function getEnrichedCart(cartId) {
  const items = db
    .prepare(
      `SELECT ci.id as itemId, ci.product_id as productId, ci.quantity, ci.size, ci.color,
              p.id, p.ref, p.name, p.category, p.subcategory, p.price, p.currency,
              p.description, p.details, p.colors as productColors, p.sizes as productSizes,
              p.stock, p.image, p.featured, p.is_new as isNew,
              p.rating, p.review_count as reviewCount, p.compare_at_price as compareAtPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?
       ORDER BY ci.id ASC`
    )
    .all(cartId);

  const enriched = items.map((row) => ({
    index: row.itemId,
    productId: row.productId,
    quantity: row.quantity,
    size: row.size,
    color: row.color,
    product: {
      id: row.id,
      ref: row.ref,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      price: row.price,
      currency: row.currency,
      description: row.description,
      details: JSON.parse(row.details || "[]"),
      colors: JSON.parse(row.productColors || "[]"),
      sizes: JSON.parse(row.productSizes || "[]"),
      stock: row.stock,
      image: row.image,
      featured: !!row.featured,
      isNew: !!row.isNew,
      rating: row.rating,
      reviewCount: row.reviewCount,
      compareAtPrice: row.compareAtPrice,
    },
    lineTotal: row.price * row.quantity,
  }));

  const subtotal = enriched.reduce((sum, i) => sum + i.lineTotal, 0);
  const count = enriched.reduce((sum, i) => sum + i.quantity, 0);

  return { id: cartId, items: enriched, subtotal, count };
}

router.get("/", (req, res) => {
  const cartId = getOrCreateCartId(req);
  res.json(getEnrichedCart(cartId));
});

router.post("/items", (req, res) => {
  const { productId, quantity = 1 } = req.body;
  // node:sqlite refuse "undefined" comme paramètre lié — contrairement à
  // d'autres bibliothèques SQLite, il exige explicitement "null".
  const size = req.body.size ?? null;
  const color = req.body.color ?? null;

  const product = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable" });

  const cartId = getOrCreateCartId(req);

  const existing = db
    .prepare(
      "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND IFNULL(size,'') = IFNULL(?, '') AND IFNULL(color,'') = IFNULL(?, '')"
    )
    .get(cartId, productId, size, color);

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(
      existing.quantity + quantity,
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO cart_items (cart_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)"
    ).run(cartId, productId, quantity, size, color);
  }

  res.json({ ...getEnrichedCart(cartId), cartId });
});

router.patch("/items/:itemId", (req, res) => {
  const { quantity } = req.body;
  const cartId = req.headers["x-cart-id"];
  const itemId = parseInt(req.params.itemId, 10);

  const item = db
    .prepare("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?")
    .get(itemId, cartId);
  if (!item) return res.status(404).json({ error: "Article introuvable" });

  if (quantity <= 0) {
    db.prepare("DELETE FROM cart_items WHERE id = ?").run(itemId);
  } else {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(quantity, itemId);
  }

  res.json(getEnrichedCart(cartId));
});

router.delete("/items/:itemId", (req, res) => {
  const cartId = req.headers["x-cart-id"];
  const itemId = parseInt(req.params.itemId, 10);
  db.prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?").run(itemId, cartId);
  res.json(getEnrichedCart(cartId));
});

export default router;
