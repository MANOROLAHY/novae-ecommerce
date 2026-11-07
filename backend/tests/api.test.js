import { test, after } from "node:test";
import assert from "node:assert/strict";

import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";

import { tmpdir } from "node:os";
import path from "node:path";

// --------------------------------------------------
// ENVIRONNEMENT TEMPORAIRE DES TESTS
// --------------------------------------------------

const tempDir = mkdtempSync(
  path.join(tmpdir(), "novae-backend-tests-")
);

process.env.SQLITE_DB_PATH = path.join(tempDir, "test.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");
process.env.ADMIN_PASSWORD = "TestAdminPassword_2026!";

// Importer l'application seulement après la configuration
const { default: app } = await import("../app.js");
const { db } = await import("../db/database.js");

// --------------------------------------------------
// SERVEUR DE TEST
// --------------------------------------------------

const server = app.listen(0);

await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

const baseUrl = `http://127.0.0.1:${server.address().port}`;

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, options);
}

// --------------------------------------------------
// PRODUIT FICTIF
// --------------------------------------------------

const fixtureProduct = {
  id: "test-product-001",
  ref: "TEST-001",
  name: "Produit Test NOVAÉ",
  category: "Mode",
  subcategory: "Accessoires",
  price: 120,
};

db.prepare(`
  INSERT INTO products (
    id, ref, name, category, subcategory, price
  )
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  fixtureProduct.id,
  fixtureProduct.ref,
  fixtureProduct.name,
  fixtureProduct.category,
  fixtureProduct.subcategory,
  fixtureProduct.price
);

let adminToken = null;
let managedProductId = "product-management-test-001";

// --------------------------------------------------
// TESTS API
// --------------------------------------------------

test("GET /api/health : vérifier que l'API fonctionne", async () => {
  const response = await request("/api/health");
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, "ok");
  assert.equal(data.service, "luxe-backend");
});

test("GET /api/inconnue : retourner une erreur 404", async () => {
  const response = await request("/api/inconnue");
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Route introuvable");
});

test("GET /api/products : récupérer la liste des produits", async () => {
  const response = await request("/api/products");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  assert.ok(
    products.some(product => product.id === fixtureProduct.id)
  );
});

test("GET /api/products : filtrer par catégorie et sous-catégorie", async () => {
  const response = await request(
    "/api/products?category=Mode&subcategory=Accessoires"
  );

  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));
  assert.ok(
    products.some(product => product.id === fixtureProduct.id)
  );

  assert.ok(
    products.every(
      product =>
        product.category.toLowerCase() === "mode" &&
        product.subcategory.toLowerCase() === "accessoires"
    )
  );
});

test("GET /api/products : rechercher un produit par son nom", async () => {
  const response = await request(
    "/api/products?search=Produit%20Test"
  );

  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  assert.ok(
    products.some(product => product.id === fixtureProduct.id)
  );
});

test("GET /api/products/categories : récupérer les catégories", async () => {
  const response = await request("/api/products/categories");
  const categories = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(categories));

  assert.ok(
    categories.some(category => category.category === "Mode")
  );
});

test("GET /api/products/:id : récupérer un produit existant", async () => {
  const response = await request(
    `/api/products/${fixtureProduct.id}`
  );

  const product = await response.json();

  assert.equal(response.status, 200);
  assert.equal(product.id, fixtureProduct.id);
  assert.equal(product.name, fixtureProduct.name);
  assert.equal(product.price, fixtureProduct.price);
});

test("GET /api/products/:id : refuser un produit inexistant", async () => {
  const response = await request("/api/products/produit-inexistant");
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Produit introuvable");
});

test("POST /api/products : refuser une création sans authentification", async () => {
  const response = await request("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Produit non autorisé",
      category: "Mode",
      subcategory: "Accessoires",
      price: 50,
    }),
  });

  assert.equal(response.status, 401);
});

test("POST /api/admin/login : refuser un mauvais mot de passe", async () => {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: "MauvaisMotDePasse",
    }),
  });

  assert.equal(response.status, 401);
});

test("POST /api/admin/login : accepter le bon mot de passe", async () => {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: "TestAdminPassword_2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.token);

  adminToken = data.token;
});

test("POST /api/products : refuser un produit sans champs obligatoires", async () => {
  const response = await request("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      name: "",
      category: "Mode",
      subcategory: "Accessoires",
      price: 150,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.error,
    "Nom, catégorie, sous-catégorie et prix sont obligatoires"
  );
});


test("POST /api/products : créer un produit avec authentification", async () => {
  assert.ok(adminToken, "Le jeton administrateur doit être disponible");

  const response = await request("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      name: "Nouveau Produit Test",
      category: "Mode",
      subcategory: "Accessoires",
      price: 150,
      stock: 10,
    }),
  });

  const product = await response.json();

  assert.equal(response.status, 201);
  assert.equal(product.name, "Nouveau Produit Test");
  assert.equal(product.price, 150);
});

test("POST /api/products : créer un produit pour les tests de gestion", async () => {
  const response = await request("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      id: managedProductId,
      ref: "MANAGED-TEST-001",
      name: "Produit Gestion Test",
      category: "Mode",
      subcategory: "Accessoires",
      price: 200,
      stock: 15,
      image: "bag",
    }),
  });

  const product = await response.json();

  assert.equal(response.status, 201);
  assert.equal(product.id, managedProductId);
  assert.equal(product.name, "Produit Gestion Test");
  assert.equal(product.price, 200);
});

test("PUT /api/products/:id : modifier un produit", async () => {
  const response = await request(`/api/products/${managedProductId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      ref: "MANAGED-TEST-001",
      name: "Produit Gestion Modifié",
      category: "Mode",
      subcategory: "Accessoires",
      price: 250,
      currency: "EUR",
      description: "Description modifiée pour le test",
      stock: 20,
      image: "bag",
      details: [],
      colors: [],
      sizes: [],
      featured: true,
      isNew: false,
      rating: 4.5,
      reviewCount: 3,
      compareAtPrice: 300,
    }),
  });

  const product = await response.json();

  assert.equal(response.status, 200);
  assert.equal(product.id, managedProductId);
  assert.equal(product.name, "Produit Gestion Modifié");
  assert.equal(product.price, 250);
  assert.equal(product.stock, 20);
  assert.equal(product.featured, true);
});

test("GET /api/products : filtrer les produits mis en avant", async () => {
  const response = await request("/api/products?featured=true");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  assert.ok(
    products.some(product => product.id === managedProductId)
  );

  assert.ok(products.every(product => product.featured === true));
});

test("GET /api/products : filtrer les nouveautés", async () => {
  const response = await request("/api/products?isNew=true");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  assert.ok(
    products.every(product => product.isNew === true)
  );

  assert.ok(
    products.every(product => product.id !== managedProductId)
  );
});

test("GET /api/products : trier les produits par prix croissant", async () => {
  const response = await request("/api/products?sort=price_asc");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  for (let i = 1; i < products.length; i++) {
    assert.ok(
      products[i - 1].price <= products[i].price,
      "Les produits doivent être classés du moins cher au plus cher"
    );
  }
});

test("GET /api/products : trier les produits par prix décroissant", async () => {
  const response = await request("/api/products?sort=price_desc");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  for (let i = 1; i < products.length; i++) {
    assert.ok(
      products[i - 1].price >= products[i].price,
      "Les produits doivent être classés du plus cher au moins cher"
    );
  }
});

test("GET /api/products : trier les produits par ordre alphabétique", async () => {
  const response = await request("/api/products?sort=name");
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(products));

  const names = products.map(product => product.name);

  assert.deepEqual(
    names,
    [...names].sort(),
    "Les produits doivent être classés par ordre alphabétique"
  );
});

test("PUT /api/products/:id : refuser une modification sans authentification", async () => {
  const response = await request(`/api/products/${managedProductId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Modification non autorisée",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "Authentification administrateur requise");
});

test("PUT /api/products/:id : refuser un produit inexistant", async () => {
  const response = await request("/api/products/produit-inexistant-001", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      ref: "UNKNOWN",
      name: "Produit inexistant",
      category: "Mode",
      subcategory: "Accessoires",
      price: 100,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Produit introuvable");
});

test("POST /api/products/:id/image : refuser un envoi sans authentification", async () => {
  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "Authentification administrateur requise");
});

test("POST /api/products/:id/image : refuser une requête sans image", async () => {
  const form = new FormData();

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Aucune image envoyée");
});

test("POST /api/products/:id/image : refuser un format de fichier non autorisé", async () => {
  const form = new FormData();

  const invalidFile = new Blob(
    ["Contenu de test non autorisé"],
    { type: "text/plain" }
  );

  form.append("image", invalidFile, "document.txt");

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.error,
    "Format image non autorisé. Utilisez JPG, PNG ou WEBP."
  );
});

test("POST /api/products/:id/image : refuser une image dépassant 5 Mo", async () => {
  const form = new FormData();

  const oversizedBytes = new Uint8Array(5 * 1024 * 1024 + 1);

  const image = new Blob(
    [oversizedBytes],
    { type: "image/png" }
  );

  form.append("image", image, "image-trop-grande.png");

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.error,
    "L'image est trop grande. Taille maximale : 5 Mo."
  );
});

test("POST /api/products/:id/image : refuser un champ de fichier inattendu", async () => {
  const form = new FormData();

  const image = new Blob(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    { type: "image/png" }
  );

  // Le champ "photo" est inattendu : le serveur attend "image".
  form.append("photo", image, "test.png");

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Erreur upload : Unexpected file field");
});

test("POST /api/products/:id/image : accepter une image PNG valide", async () => {
  const form = new FormData();

  const pngBytes = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);

  const image = new Blob([pngBytes], {
    type: "image/png",
  });

  form.append("image", image, "test.png");

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.product.id, managedProductId);
  assert.match(data.product.image, /^\/uploads\/products\/.+\.png$/);
});

test("POST /api/products/:id/image : supprimer l'ancienne image lors du remplacement", async () => {
  const oldFilename = "ancienne-image-test.png";
  const oldPath = path.join(process.env.UPLOAD_DIR, oldFilename);

  writeFileSync(oldPath, "ancienne image de test");

  db.prepare(
    "UPDATE products SET image = ? WHERE id = ?"
  ).run(`/uploads/products/${oldFilename}`, managedProductId);

  assert.equal(existsSync(oldPath), true);

  const form = new FormData();

  const image = new Blob(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    { type: "image/png" }
  );

  form.append("image", image, "nouvelle-image.png");

  const response = await request(`/api/products/${managedProductId}/image`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(existsSync(oldPath), false);
  assert.match(data.product.image, /^\/uploads\/products\/.+\.png$/);
});

test("POST /api/products/:id/image : refuser un produit inexistant", async () => {
  const form = new FormData();

  const image = new Blob(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    { type: "image/png" }
  );

  form.append("image", image, "inconnu.png");

  const response = await request("/api/products/produit-inexistant-001/image", {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
    body: form,
  });

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Produit introuvable");
});

test("DELETE /api/products/:id : refuser une suppression sans authentification", async () => {
  const response = await request(`/api/products/${managedProductId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "Authentification administrateur requise");
});

test("DELETE /api/products/:id : refuser un produit inexistant", async () => {
  const response = await request("/api/products/produit-inexistant-001", {
    method: "DELETE",
    headers: {
      "x-admin-token": adminToken,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Produit introuvable");
});

test("DELETE /api/products/:id : gérer une erreur lors de la suppression", async () => {
  db.exec(`
    CREATE TRIGGER test_product_delete_error
    BEFORE DELETE ON products
    BEGIN
      SELECT RAISE(ABORT, 'Erreur volontaire de test');
    END;
  `);

  try {
    const response = await request(`/api/products/${managedProductId}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": adminToken,
      },
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(data.error, "Impossible de supprimer le produit");
  } finally {
    db.exec("DROP TRIGGER IF EXISTS test_product_delete_error");
  }
});

test("DELETE /api/products/:id : supprimer un produit existant", async () => {
  const response = await request(`/api/products/${managedProductId}`, {
    method: "DELETE",
    headers: {
      "x-admin-token": adminToken,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.id, managedProductId);
  assert.equal(data.message, "Produit supprimé avec succès");

  const checkResponse = await request(`/api/products/${managedProductId}`);

  assert.equal(checkResponse.status, 404);
});

// --------------------------------------------------
// NETTOYAGE
// --------------------------------------------------

after(async () => {
  server.closeAllConnections();

  await new Promise(resolve => {
    server.close(resolve);
  });

  db.close();

  rmSync(tempDir, {
    recursive: true,
    force: true,
  });
});

// --------------------------------------------------
// TESTS AUTHENTIFICATION CLIENT
// --------------------------------------------------

let clientToken = null;

test("POST /api/auth/register : refuser une adresse email vide", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Client Test",
      email: "",
      password: "PasswordTest2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Adresse email invalide");
});

test("POST /api/auth/register : refuser un nom trop court", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "A",
      email: "nom-court@novae.test",
      password: "PasswordTest2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.error,
    "Le nom doit contenir au moins 2 caractères"
  );
});

test("POST /api/auth/register : refuser un mot de passe trop court", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Client Test",
      email: "password-court@novae.test",
      password: "123",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.error,
    "Le mot de passe doit contenir au moins 8 caractères"
  );
});

test("POST /api/auth/register : créer un compte client", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Client Test",
      email: "CLIENT-TEST@NOVAE.TEST",
      password: "ClientPassword2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.user);
  assert.ok(data.token);
  assert.equal(data.user.name, "Client Test");
  assert.equal(data.user.email, "client-test@novae.test");

  assert.equal(
    Object.hasOwn(data.user, "password_hash"),
    false
  );

  clientToken = data.token;
});

test("POST /api/auth/register : gérer une erreur lors de la création", async () => {
  db.exec(`
    CREATE TRIGGER test_user_insert_error
    BEFORE INSERT ON users
    BEGIN
      SELECT RAISE(ABORT, 'Erreur volontaire de test');
    END;
  `);

  try {
    const response = await request("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Client Erreur",
        email: "client-erreur@novae.test",
        password: "ClientPassword2026!",
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(data.error, "Impossible de créer le compte");
  } finally {
    db.exec("DROP TRIGGER IF EXISTS test_user_insert_error");
  }
});

test("POST /api/auth/register : refuser une adresse déjà utilisée", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Autre Client",
      email: "client-test@novae.test",
      password: "AutrePassword2026!",
    }),
  });

  assert.equal(response.status, 409);
});

test("POST /api/auth/register : refuser une adresse email invalide", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Client Test",
      email: "adresse-invalide",
      password: "PasswordTest2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Adresse email invalide");
});

test("POST /api/auth/login : refuser un email ou mot de passe vide", async () => {
  const responseEmail = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "",
      password: "PasswordTest2026!",
    }),
  });

  assert.equal(responseEmail.status, 400);

  const responsePassword = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "client-test@novae.test",
      password: "",
    }),
  });

  assert.equal(responsePassword.status, 400);
});

test("POST /api/auth/login : refuser un mauvais mot de passe", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "client-test@novae.test",
      password: "MauvaisPassword2026!",
    }),
  });

  assert.equal(response.status, 401);
});

test("POST /api/auth/login : refuser un hash sans séparateur", async () => {
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`
  ).run(
    "user-invalid-hash-001",
    "Utilisateur Hash Invalide",
    "hash-invalide@novae.test",
    "hashmalforme"
  );

  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {

      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "hash-invalide@novae.test",
      password: "PasswordTest2026!",
    }),
  });

  assert.equal(response.status, 401);
});

test("POST /api/auth/login : gérer une erreur lors de la création de session", async () => {
  db.exec(`
    CREATE TRIGGER test_client_session_error
    BEFORE INSERT ON client_sessions
    BEGIN
      SELECT RAISE(ABORT, 'Erreur volontaire de test');
    END;
  `);

  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "client-test@novae.test",
        password: "ClientPassword2026!",
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(data.error, "Impossible de se connecter");
  } finally {
    db.exec("DROP TRIGGER IF EXISTS test_client_session_error");
  }
});

test("POST /api/auth/login : refuser un hash de longueur incorrecte", async () => {
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`
  ).run(
    "user-invalid-hash-002",
    "Utilisateur Hash Incomplet",
    "hash-court@novae.test",
    "salt:abcd"
  );

  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "hash-court@novae.test",
      password: "PasswordTest2026!",
    }),
  });

  assert.equal(response.status, 401);
});

test("GET /api/auth/me : récupérer le compte connecté", async () => {
  assert.ok(clientToken);

  const response = await request("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${clientToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.user.email, "client-test@novae.test");
  assert.equal(data.user.name, "Client Test");
});

test("GET /api/auth/me : refuser une session sans token", async () => {
  const response = await request("/api/auth/me");

  assert.equal(response.status, 401);
});

test("POST /api/auth/logout : déconnecter le client", async () => {
  const response = await request("/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientToken}`,
    },
  });

  assert.equal(response.status, 200);
});

test("GET /api/auth/me : refuser une session après déconnexion", async () => {
  const response = await request("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${clientToken}`,
    },
  });

  assert.equal(response.status, 401);
});

// --------------------------------------------------
// TESTS DU PANIER
// --------------------------------------------------

let cartId = null;
let cartItemId = null;

test("GET /api/cart : créer un panier vide", async () => {
  const response = await request("/api/cart");
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.id);
  assert.ok(Array.isArray(data.items));
  assert.equal(data.items.length, 0);
  assert.equal(data.subtotal, 0);
  assert.equal(data.count, 0);

  cartId = data.id;
});

test("POST /api/cart/items : refuser un produit inexistant", async () => {
  const response = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      productId: "produit-inexistant",
      quantity: 1,
    }),
  });

  assert.equal(response.status, 404);
});

test("POST /api/cart/items : ajouter un produit au panier", async () => {
  const response = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 2,
      size: "M",
      color: "Noir",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.cartId, cartId);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].quantity, 2);
  assert.equal(data.items[0].size, "M");
  assert.equal(data.items[0].color, "Noir");
  assert.equal(data.subtotal, 240);
  assert.equal(data.count, 2);

  cartItemId = data.items[0].index;
});

test("POST /api/cart/items : cumuler les quantités d'un même article", async () => {
  const response = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 1,
      size: "M",
      color: "Noir",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].quantity, 3);
  assert.equal(data.subtotal, 360);
  assert.equal(data.count, 3);
});

test("PATCH /api/cart/items/:itemId : modifier la quantité", async () => {
  const response = await request(
    `/api/cart/items/${cartItemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        quantity: 4,
      }),
    }
  );

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].quantity, 4);
  assert.equal(data.subtotal, 480);
  assert.equal(data.count, 4);
});

test("DELETE /api/cart/items/:itemId : supprimer un article", async () => {
  const response = await request(
    `/api/cart/items/${cartItemId}`,
    {
      method: "DELETE",
      headers: {
        "x-cart-id": cartId,
      },
    }
  );

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 0);
  assert.equal(data.subtotal, 0);
  assert.equal(data.count, 0);
});

// --------------------------------------------------
// TESTS DES COMMANDES
// --------------------------------------------------

let guestOrderId = null;
let clientOrderId = null;

const customerFixture = {

  name: "Client Test NOVAÉ",
  email: "commande@novae.test",
  address: "123 Rue du Commerce",
  city: "Antananarivo",
  postalCode: "101",
  country: "Madagascar",
};

test("PATCH /api/cart/items/:itemId : supprimer un article si quantité égale à zéro", async () => {
  // Ajouter un article au panier
  const addResponse = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 1,
      size: "M",
      color: "Noir",
    }),
  });

  const addData = await addResponse.json();

  assert.equal(addResponse.status, 200);
  assert.equal(addData.items.length, 1);

  const itemId = addData.items[0].index;

  // Mettre la quantité à zéro
  const response = await request(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      quantity: 0,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 0);
  assert.equal(data.subtotal, 0);
  assert.equal(data.count, 0);
});

// --------------------------------------------------
// VALIDATION DE CREATION DES COMMANDES
// --------------------------------------------------

test("POST /api/orders : refuser une commande sans identifiant de panier", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: customerFixture,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Identifiant du panier manquant");
});

test("POST /api/orders : refuser les informations client incomplètes", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": "cart-test-invalid",
    },
    body: JSON.stringify({
      customer: {
        name: "Client Test",
        email: "test@novae.test",
      },
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Informations client incomplètes");
});

test("POST /api/orders : refuser une commande avec un panier vide", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    },
    body: JSON.stringify({
      customer: customerFixture,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Le panier est vide");
});

// --------------------------------------------------
// CREATION D'UNE COMMANDE INVITE
// --------------------------------------------------

let orderCartId = null;
let ordersClientToken = null;
let clientOrderCartId = null;

test("POST /api/cart/items : préparer un panier pour une commande invité", async () => {
  const response = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 2,
      size: "M",
      color: "Noir",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.cartId);
  assert.equal(data.items.length, 1);
  assert.equal(data.count, 2);

  orderCartId = data.cartId;
});

test("POST /api/orders : créer une commande invité", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": orderCartId,
    },
    body: JSON.stringify({
      customer: customerFixture,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.id);
  assert.ok(data.reference);
  assert.equal(data.customer.name, customerFixture.name);
  assert.equal(data.customer.email, customerFixture.email);
  assert.equal(data.total, 240);
  assert.equal(data.status, "confirmée");
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].quantity, 2);

  guestOrderId = data.id;
});

test("GET /api/cart : vérifier que le panier est vidé après une commande", async () => {
  const response = await request("/api/cart", {
    headers: {
      "x-cart-id": orderCartId,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 0);
  assert.equal(data.subtotal, 0);
  assert.equal(data.count, 0);
});

test("POST /api/orders : gérer une erreur lors de la création", async () => {
  const cartResponse = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 1,
      size: "M",
      color: "Noir",
    }),
  });

  const cartData = await cartResponse.json();

  assert.equal(cartResponse.status, 200);
  assert.ok(cartData.cartId);

  db.exec(`
    CREATE TRIGGER test_order_insert_error
    BEFORE INSERT ON orders
    BEGIN
      SELECT RAISE(ABORT, 'Erreur volontaire de test');
    END;
  `);

  try {
    const response = await request("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartData.cartId,
      },
      body: JSON.stringify({
        customer: customerFixture,
      }),
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(
      data.error,
      "Impossible de créer la commande"
    );
  } finally {
    db.exec("DROP TRIGGER IF EXISTS test_order_insert_error");
  }
});

// --------------------------------------------------
// RECONNEXION DU CLIENT POUR LES TESTS DE COMMANDES
// --------------------------------------------------

test("POST /api/auth/login : reconnecter le client pour les commandes", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "client-test@novae.test",
      password: "ClientPassword2026!",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.token);

  ordersClientToken = data.token;
});

// --------------------------------------------------
// COMMANDE D'UN CLIENT CONNECTE
// --------------------------------------------------

test("POST /api/cart/items : préparer le panier du client connecté", async () => {
  const response = await request("/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ordersClientToken}`,
    },
    body: JSON.stringify({
      productId: fixtureProduct.id,
      quantity: 1,
      size: "L",
      color: "Noir",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.cartId);
  assert.equal(data.items.length, 1);
  assert.equal(data.count, 1);

  clientOrderCartId = data.cartId;
});

test("POST /api/orders : créer une commande pour un client connecté", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ordersClientToken}`,
      "x-cart-id": clientOrderCartId,
    },
    body: JSON.stringify({
      customer: {
        ...customerFixture,
        email: "client-test@novae.test",
      },
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.id);
  assert.ok(data.reference);
  assert.equal(data.customer.name, customerFixture.name);
  assert.equal(data.customer.email, "client-test@novae.test");
  assert.equal(data.total, 120);
  assert.equal(data.status, "confirmée");
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].quantity, 1);

  clientOrderId = data.id;
});

test("GET /api/orders/my : refuser un client non authentifié", async () => {
  const response = await request("/api/orders/my");

  assert.equal(response.status, 401);
});

test("GET /api/orders/my : récupérer les commandes du client connecté", async () => {
  const response = await request("/api/orders/my", {
    headers: {
      Authorization: `Bearer ${ordersClientToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data.orders));

  const order = data.orders.find(
    (item) => item.id === clientOrderId
  );

  assert.ok(order);
  assert.equal(order.customer.email, "client-test@novae.test");
  assert.equal(order.total, 120);
});

test("GET /api/orders/my : gérer une erreur lors de la récupération", async () => {
  const registerResponse = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Client Erreur Test",
      email: "client-erreur@novae.test",
      password: "ClientErreurPassword2026!",
    }),
  });

  const registerData = await registerResponse.json();

  assert.equal(registerResponse.status, 201);
  assert.ok(registerData.token);

  db.exec("ALTER TABLE orders RENAME TO orders_backup_for_test");

  try {
    const response = await request("/api/orders/my", {
      headers: {
        Authorization: `Bearer ${registerData.token}`,
      },
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(
      data.error,
      "Impossible de récupérer vos commandes"
    );
  } finally {
    db.exec("ALTER TABLE orders_backup_for_test RENAME TO orders");
  }
});

test("GET /api/orders/:id : consulter une commande invité", async () => {
  const response = await request(`/api/orders/${guestOrderId}`);

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.id, guestOrderId);
  assert.equal(data.customer.email, "commande@novae.test");
});

test("GET /api/orders/:id : refuser l'accès anonyme à une commande client", async () => {
  const response = await request(`/api/orders/${clientOrderId}`);

  assert.equal(response.status, 403);
});

test("GET /api/orders/:id : autoriser le propriétaire de la commande", async () => {
  const response = await request(`/api/orders/${clientOrderId}`, {
    headers: {
      Authorization: `Bearer ${ordersClientToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.id, clientOrderId);
  assert.equal(data.customer.email, "client-test@novae.test");
});

test("GET /api/orders/:id : refuser une commande inexistante", async () => {
  const response = await request(
    "/api/orders/commande-inexistante"
  );

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Commande introuvable");
});

test("GET /api/orders/admin/all : refuser un accès sans authentification admin", async () => {
  const response = await request("/api/orders/admin/all");

  assert.equal(response.status, 401);
});

test("GET /api/orders/admin/all : récupérer les commandes avec authentification admin", async () => {
  const response = await request("/api/orders/admin/all", {
    headers: {
      "x-admin-token": adminToken,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data.orders));
  assert.ok(data.orders.length >= 2);
  assert.ok(data.stats);
  assert.equal(data.stats.totalOrders, 2);
  assert.equal(data.stats.totalRevenue, 360);
  assert.equal(data.stats.confirmedOrders, 2);
});

test("GET /api/orders/admin/all : gérer une erreur lors de la récupération", async () => {
  let tableRenamed = false;

  try {
    db.exec("ALTER TABLE orders RENAME TO orders_test_backup");
    tableRenamed = true;

    const response = await request("/api/orders/admin/all", {
      headers: {
        "x-admin-token": adminToken,
      },
    });

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(
      data.error,
      "Impossible de récupérer les commandes"
    );
  } finally {
    if (tableRenamed) {
      db.exec("ALTER TABLE orders_test_backup RENAME TO orders");
    }
  }
});

test("PUT /api/orders/admin/:id/status : refuser un statut invalide", async () => {
  const response = await request(`/api/orders/admin/${guestOrderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      status: "inconnu",
    }),
  });

  assert.equal(response.status, 400);
});

test("PUT /api/orders/admin/:id/status : refuser une commande inexistante", async () => {
  const response = await request("/api/orders/admin/commande-inexistante/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      status: "expédiée",
    }),
  });

  assert.equal(response.status, 404);
});

test("GET /api/orders/:id : gérer une erreur lors de la récupération", async () => {
  let tableRenamed = false;

  try {
    db.exec("ALTER TABLE orders RENAME TO orders_test_backup");
    tableRenamed = true;

    const response = await request(`/api/orders/${guestOrderId}`);

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(
      data.error,
      "Impossible de récupérer la commande"
    );
  } finally {
    if (tableRenamed) {
      db.exec("ALTER TABLE orders_test_backup RENAME TO orders");
    }
  }
});

test("PUT /api/orders/admin/:id/status : modifier le statut d'une commande", async () => {
  const response = await request(`/api/orders/admin/${guestOrderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      status: "expédiée",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.order.id, guestOrderId);
  assert.equal(data.order.status, "expédiée");
});

test("PUT /api/orders/admin/:id/status : gérer une erreur lors de la modification", async () => {
  db.exec(`
    CREATE TRIGGER test_order_update_error
    BEFORE UPDATE ON orders
    BEGIN
      SELECT RAISE(ABORT, 'Erreur volontaire de test');
    END;
  `);

  try {
    const response = await request(
      `/api/orders/admin/${guestOrderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          status: "livrée",
        }),
      }
    );

    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(
      data.error,
      "Impossible de modifier le statut de la commande"
    );
  } finally {
    db.exec("DROP TRIGGER IF EXISTS test_order_update_error");
  }
});

test("POST /api/admin/logout : déconnecter l'administrateur", async () => {
  const response = await request("/api/admin/logout", {
    method: "POST",
    headers: {
      "x-admin-token": adminToken,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);

  const protectedResponse = await request("/api/orders/admin/all", {
    headers: {
      "x-admin-token": adminToken,
    },
  });

  assert.equal(protectedResponse.status, 401);
});
