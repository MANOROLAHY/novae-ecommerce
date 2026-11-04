import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db, runInTransaction } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function seedIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM products").get();
  if (count > 0) {
    console.log(`Base déjà peuplée (${count} produits) — seed ignoré.`);
    return;
  }

  const seedPath = path.join(__dirname, "..", "data", "products.seed.json");
  const products = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  const insert = db.prepare(`
    INSERT INTO products
      (id, ref, name, category, subcategory, price, currency, description, details, colors, sizes, stock, image, featured, is_new, rating, review_count, compare_at_price)
    VALUES
      (@id, @ref, @name, @category, @subcategory, @price, @currency, @description, @details, @colors, @sizes, @stock, @image, @featured, @is_new, @rating, @review_count, @compare_at_price)
  `);

  // runInTransaction regroupe toutes les insertions en une seule opération
  // atomique : soit tout réussit, soit rien n'est écrit (contrairement à
  // fs.writeFileSync sur un fichier JSON, qui n'offre aucune garantie de ce type).
  runInTransaction(() => {
    for (const p of products) {
      insert.run({
        id: p.id,
        ref: p.ref,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        price: p.price,
        currency: p.currency,
        description: p.description,
        details: JSON.stringify(p.details || []),
        colors: JSON.stringify(p.colors || []),
        sizes: JSON.stringify(p.sizes || []),
        stock: p.stock,
        image: p.image,
        featured: p.featured ? 1 : 0,
        is_new: p.isNew ? 1 : 0,
        rating: p.rating ?? null,
        review_count: p.reviewCount ?? 0,
        compare_at_price: p.compareAtPrice ?? null,
      });
    }
  });
  console.log(`${products.length} produits importés dans la base SQLite.`);
}
