const BASE = "/api";

function cartHeaders() {
  const id = localStorage.getItem("cartId");
  return id ? { "x-cart-id": id } : {};
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/products${query ? `?${query}` : ""}`);
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${BASE}/products/${id}`);

  if (!res.ok) {
    throw new Error("Produit introuvable");
  }

  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/products/categories`);
  return res.json();
}

export async function fetchCart() {
  const res = await fetch(`${BASE}/cart`, {
    headers: cartHeaders(),
  });

  const data = await res.json();

  if (data.id) {
    localStorage.setItem("cartId", data.id);
  }

  return data;
}

export async function addToCart({
  productId,
  quantity,
  size,
  color,
}) {
  const res = await fetch(`${BASE}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...cartHeaders(),
    },
    body: JSON.stringify({
      productId,
      quantity,
      size,
      color,
    }),
  });

  const data = await res.json();

  if (data.cartId) {
    localStorage.setItem("cartId", data.cartId);
  }

  return data;
}

export async function updateCartItem(index, quantity) {
  const res = await fetch(`${BASE}/cart/items/${index}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...cartHeaders(),
    },
    body: JSON.stringify({ quantity }),
  });

  return res.json();
}

export async function removeCartItem(index) {
  const res = await fetch(`${BASE}/cart/items/${index}`, {
    method: "DELETE",
    headers: cartHeaders(),
  });

  return res.json();
}

export async function placeOrder(customer) {
  const token = localStorage.getItem("novae_token");

  const headers = {
    "Content-Type": "application/json",
    ...cartHeaders(),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({ customer }),
  });

  if (!res.ok) {
    const err = await res.json();

    throw new Error(
      err.error || "Erreur lors de la commande"
    );
  }

  return res.json();
}

/* =========================================================
   ADMIN
   ========================================================= */

function adminHeaders() {
  const token = localStorage.getItem("adminToken");

  return token
    ? { "x-admin-token": token }
    : {};
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const err = await res.json();

    throw new Error(
      err.error || "Échec de connexion"
    );
  }

  const data = await res.json();

  localStorage.setItem(
    "adminToken",
    data.token
  );

  return data.token;
}

export async function adminLogout() {
  const token = localStorage.getItem("adminToken");

  localStorage.removeItem("adminToken");

  if (token) {
    fetch(`${BASE}/admin/logout`, {
      method: "POST",
      headers: {
        "x-admin-token": token,
      },
    }).catch(() => {});
  }
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem("adminToken");
}

/* =========================================================
   GESTION DES RÉPONSES ADMIN
   ========================================================= */

async function handleAdminResponse(
  res,
  fallbackMessage
) {
  if (res.status === 401) {
    localStorage.removeItem("adminToken");

    window.location.href =
      "/admin/connexion?expired=1";

    return new Promise(() => {});
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.error || fallbackMessage
    );
  }

  return res.json();
}

/* =========================================================
   PRODUITS ADMIN
   ========================================================= */

export async function createProduct(product) {
  const res = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(product),
  });

  return handleAdminResponse(
    res,
    "Erreur lors de la création"
  );
}

export async function updateProduct(id, product) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(),
    },
    body: JSON.stringify(product),
  });

  return handleAdminResponse(
    res,
    "Erreur lors de la modification"
  );
}

export async function deleteProduct(productId) {
  if (!productId) {
    throw new Error("Identifiant du produit manquant.");
  }

  const res = await fetch(`${BASE}/products/${productId}`, {
    method: "DELETE",
    headers: {
      ...adminHeaders(),
    },
  });

  return handleAdminResponse(
    res,
    "Impossible de supprimer le produit"
  );
}

/* =========================================================
   UPLOAD PHOTO PRODUIT
   ========================================================= */

export async function uploadProductImage(
  productId,
  file
) {
  if (!file) {
    throw new Error("Aucune image sélectionnée");
  }

  const formData = new FormData();

  formData.append("image", file);

  const res = await fetch(
    `${BASE}/products/${productId}/image`,
    {
      method: "POST",
      headers: {
        ...adminHeaders(),
      },
      body: formData,
    }
  );

  return handleAdminResponse(
    res,
    "Erreur lors de l'envoi de l'image"
  );
}

/* =========================================================
   COMMANDES ADMIN
   ========================================================= */

export async function fetchAdminOrders() {
  const res = await fetch(`${BASE}/orders/admin/all`, {
    headers: {
      ...adminHeaders(),
    },
  });

  return handleAdminResponse(
    res,
    "Erreur lors de la récupération des commandes"
  );
}

/* =========================================================
   MODIFICATION DU STATUT D'UNE COMMANDE
   ========================================================= */

export async function updateAdminOrderStatus(
  orderId,
  status
) {
  if (!orderId) {
    throw new Error("Identifiant de commande manquant");
  }

  if (!status) {
    throw new Error("Statut de commande manquant");
  }

  const res = await fetch(
    `${BASE}/orders/admin/${orderId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  return handleAdminResponse(
    res,
    "Erreur lors de la modification du statut"
  );
}
