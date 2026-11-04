// node:sqlite est le module SQLite intégré à Node.js.
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "luxe.db");

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// -----------------------------------------------------------------------------
// Schéma
// -----------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    ref TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    details TEXT,
    colors TEXT,
    sizes TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    rating REAL,
    review_count INTEGER DEFAULT 0,
    compare_at_price REAL
  );

  CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    color TEXT
  );

  -- Comptes clients
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sessions des clients
  CREATE TABLE IF NOT EXISTS client_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    customer_postal_code TEXT NOT NULL,
    customer_country TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmée',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    size TEXT,
    color TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_cart_items_cart
    ON cart_items(cart_id);

  CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id);

  CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category);

  CREATE INDEX IF NOT EXISTS idx_client_sessions_user
    ON client_sessions(user_id);

  -- Sessions d'administration
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// -----------------------------------------------------------------------------
// Migration de la table orders
// -----------------------------------------------------------------------------
// Les anciennes installations possèdent déjà la table orders sans user_id.
// On ajoute la colonne uniquement si elle n'existe pas encore.

const orderColumns = db
  .prepare("PRAGMA table_info(orders)")
  .all();

const hasUserId = orderColumns.some(
  (column) => column.name === "user_id"
);

if (!hasUserId) {
  db.exec(`
    ALTER TABLE orders
    ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL
  `);
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_orders_user
  ON orders(user_id);
`);

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------

export function runInTransaction(fn) {
  db.exec("BEGIN");

  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export default db;
