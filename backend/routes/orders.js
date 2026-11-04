import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, runInTransaction } from "../db/database.js";
import {
  requireClient,
  getTokenFromRequest,
  getUserFromToken,
} from "../middleware/clientAuth.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

/**
 * =========================================================
 * UTILITAIRE
 * =========================================================
 */

/**
 * Transforme une commande SQLite en objet utilisable par le frontend.
 */
function formatOrder(order) {
  const items = db
    .prepare(
      `SELECT *
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`
    )
    .all(order.id);

  return {
    id: order.id,
    reference: order.reference,

    customer: {
      name: order.customer_name,
      email: order.customer_email,
      address: order.customer_address,
      city: order.customer_city,
      postalCode: order.customer_postal_code,
      country: order.customer_country,
    },

    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),

    total: order.total,
    status: order.status,
    createdAt: order.created_at,
  };
}

/**
 * Normalise les différents noms de statut.
 *
 * Les statuts réellement enregistrés dans la base
 * seront toujours en français.
 */
function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  const statuses = {
    confirmed: "confirmée",
    confirmée: "confirmée",
    confirmee: "confirmée",

    pending: "en attente",
    "en attente": "en attente",

    shipped: "expédiée",
    expédiée: "expédiée",
    expediee: "expédiée",

    delivered: "livrée",
    livrée: "livrée",
    livree: "livrée",

    cancelled: "annulée",
    canceled: "annulée",
    annulée: "annulée",
    annulee: "annulée",
  };

  return statuses[value] || null;
}

/**
 * =========================================================
 * CLIENT
 * =========================================================
 */

/**
 * POST /api/orders
 *
 * Crée une commande.
 */
router.post("/", (req, res) => {
  try {
    const cartId = req.headers["x-cart-id"];
    const { customer } = req.body;

    if (!cartId) {
      return res.status(400).json({
        error: "Identifiant du panier manquant",
      });
    }

    if (!customer?.name || !customer?.email || !customer?.address) {
      return res.status(400).json({
        error: "Informations client incomplètes",
      });
    }

    const token = getTokenFromRequest(req);
    const user = getUserFromToken(token);
    const userId = user?.id || null;

    const items = db
      .prepare(
        `SELECT
           ci.id,
           ci.product_id,
           ci.quantity,
           ci.size,
           ci.color,
           p.name,
           p.price
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = ?`
      )
      .all(cartId);

    if (items.length === 0) {
      return res.status(400).json({
        error: "Le panier est vide",
      });
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderId = uuidv4();

    const reference = `CMD-${Date.now()
      .toString()
      .slice(-8)}`;

    runInTransaction(() => {
      db.prepare(
        `INSERT INTO orders
          (
            id,
            reference,
            user_id,
            customer_name,
            customer_email,
            customer_address,
            customer_city,
            customer_postal_code,
            customer_country,
            total,
            status
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmée')`
      ).run(
        orderId,
        reference,
        userId,
        customer.name,
        customer.email,
        customer.address,
        customer.city || "",
        customer.postalCode || "",
        customer.country || "",
        total
      );

      const insertItem = db.prepare(
        `INSERT INTO order_items
          (
            order_id,
            product_id,
            name,
            price,
            quantity,
            size,
            color
          )
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      for (const item of items) {
        insertItem.run(
          orderId,
          item.product_id,
          item.name,
          item.price,
          item.quantity,
          item.size,
          item.color
        );
      }

      db.prepare(
        "DELETE FROM cart_items WHERE cart_id = ?"
      ).run(cartId);
    });

    const createdOrder = db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId);

    return res.status(201).json(
      formatOrder(createdOrder)
    );
  } catch (error) {
    console.error(
      "Erreur création commande :",
      error
    );

    return res.status(500).json({
      error: "Impossible de créer la commande",
    });
  }
});

/**
 * GET /api/orders/my
 *
 * Commandes du client connecté.
 */
router.get("/my", requireClient, (req, res) => {
  try {
    const orders = db
      .prepare(
        `SELECT *
         FROM orders
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC`
      )
      .all(req.user.id);

    return res.json({
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error(
      "Erreur récupération historique :",
      error
    );

    return res.status(500).json({
      error: "Impossible de récupérer vos commandes",
    });
  }
});

/**
 * =========================================================
 * ADMIN
 * =========================================================
 */

/**
 * GET /api/orders/admin/all
 *
 * Retourne toutes les commandes pour le dashboard admin.
 */
router.get("/admin/all", requireAdmin, (req, res) => {
  try {
    const orders = db
      .prepare(
        `SELECT *
         FROM orders
         ORDER BY datetime(created_at) DESC`
      )
      .all();

    const formattedOrders = orders.map(formatOrder);

    const totalRevenue = formattedOrders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    const totalOrders = formattedOrders.length;

    const confirmedOrders =
      formattedOrders.filter(
        (order) =>
          order.status === "confirmée"
      ).length;

    const pendingOrders =
      formattedOrders.filter(
        (order) =>
          order.status === "en attente" ||
          order.status === "pending"
      ).length;

    const cancelledOrders =
      formattedOrders.filter(
        (order) =>
          order.status === "annulée" ||
          order.status === "cancelled"
      ).length;

    const averageOrder =
      totalOrders > 0
        ? totalRevenue / totalOrders
        : 0;

    return res.json({
      orders: formattedOrders,

      stats: {
        totalOrders,
        totalRevenue,
        averageOrder,
        confirmedOrders,
        pendingOrders,
        cancelledOrders,
      },
    });
  } catch (error) {
    console.error(
      "Erreur récupération commandes admin :",
      error
    );

    return res.status(500).json({
      error: "Impossible de récupérer les commandes",
    });
  }
});

/**
 * PUT /api/orders/admin/:id/status
 *
 * Modifie le statut d'une commande.
 *
 * Sécurisé : seul un administrateur connecté
 * peut effectuer cette opération.
 */
router.put(
  "/admin/:id/status",
  requireAdmin,
  (req, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      /**
       * Vérification du statut envoyé.
       */
      const normalizedStatus =
        normalizeStatus(status);

      if (!normalizedStatus) {
        return res.status(400).json({
          error:
            "Statut invalide. Les statuts autorisés sont : confirmée, en attente, expédiée, livrée, annulée.",
        });
      }

      /**
       * Vérification de l'existence de la commande.
       */
      const existingOrder = db
        .prepare(
          "SELECT * FROM orders WHERE id = ?"
        )
        .get(orderId);

      if (!existingOrder) {
        return res.status(404).json({
          error: "Commande introuvable",
        });
      }

      /**
       * Mise à jour du statut.
       */
      db.prepare(
        `UPDATE orders
         SET status = ?
         WHERE id = ?`
      ).run(
        normalizedStatus,
        orderId
      );

      /**
       * Récupération de la commande
       * après modification.
       */
      const updatedOrder = db
        .prepare(
          "SELECT * FROM orders WHERE id = ?"
        )
        .get(orderId);

      console.log(
        `Commande ${updatedOrder.reference} : statut modifié -> ${normalizedStatus}`
      );

      return res.json({
        message:
          "Statut de la commande mis à jour avec succès",
        order: formatOrder(updatedOrder),
      });
    } catch (error) {
      console.error(
        "Erreur modification statut commande :",
        error
      );

      return res.status(500).json({
        error:
          "Impossible de modifier le statut de la commande",
      });
    }
  }
);

/**
 * GET /api/orders/:id
 *
 * Une commande peut être consultée :
 * - par son propriétaire ;
 * - ou par son identifiant pour une commande invitée.
 */
router.get("/:id", (req, res) => {
  try {
    const order = db
      .prepare(
        "SELECT * FROM orders WHERE id = ?"
      )
      .get(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: "Commande introuvable",
      });
    }

    if (order.user_id) {
      const token = getTokenFromRequest(req);
      const user = getUserFromToken(token);

      if (
        !user ||
        user.id !== order.user_id
      ) {
        return res.status(403).json({
          error:
            "Accès à cette commande non autorisé",
        });
      }
    }

    return res.json(
      formatOrder(order)
    );
  } catch (error) {
    console.error(
      "Erreur récupération commande :",
      error
    );

    return res.status(500).json({
      error:
        "Impossible de récupérer la commande",
    });
  }
});

export default router;
