import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

import {
  fetchProducts,
  fetchAdminOrders,
  deleteProduct,
} from "../context/api.js";

import AdminLayout from "./AdminLayout.jsx";
import ProductFormModal from "./ProductFormModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

/* ================================================================
   ICÔNES
   ================================================================ */

function Icon({
  children,
  size = 18,
  strokeWidth = 1.8,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PlusIcon() {
  return (
    <Icon size={17}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

function RefreshIcon() {
  return (
    <Icon size={16}>
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M20 20v-5h-5" />
    </Icon>
  );
}

function ArrowRightIcon() {
  return (
    <Icon size={15}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

function PackageIcon() {
  return (
    <Icon size={20}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Icon>
  );
}

function ShoppingBagIcon() {
  return (
    <Icon size={20}>
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

function EuroIcon() {
  return (
    <Icon size={20}>
      <path d="M4 10h10" />
      <path d="M4 14h9" />
      <path d="M18 5.5A6 6 0 1 0 18 18" />
    </Icon>
  );
}

function AlertIcon() {
  return (
    <Icon size={20}>
      <path d="M10.3 3.6 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

function EditIcon() {
  return (
    <Icon size={14} strokeWidth={2}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </Icon>
  );
}

function TrashIcon() {
  return (
    <Icon size={14} strokeWidth={2}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </Icon>
  );
}

function ChevronRightIcon() {
  return (
    <Icon size={15}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

/* ================================================================
   HELPERS
   ================================================================ */

function formatCurrency(value) {
  const number = Number(value || 0);

  return `${number.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getOrderStatusLabel(status) {
  const labels = {
    pending: "En attente",
    confirmed: "Confirmée",
    processing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  return labels[status] || status || "Inconnue";
}

function getOrderStatusClass(status) {
  const classes = {
    pending:
      "bg-amber-50 text-amber-700 border-amber-100",
    confirmed:
      "bg-blue-50 text-blue-700 border-blue-100",
    processing:
      "bg-violet-50 text-violet-700 border-violet-100",
    shipped:
      "bg-indigo-50 text-indigo-700 border-indigo-100",
    delivered:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled:
      "bg-red-50 text-red-700 border-red-100",
  };

  return (
    classes[status] ||
    "bg-slate-50 text-slate-600 border-slate-200"
  );
}

/* ================================================================
   KPI CARD
   ================================================================ */

function StatCard({
  label,
  value,
  description,
  icon,
  iconClass,
  loading,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        {loading ? (
          <div className="mt-2 h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        )}

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   BARRE DE PROGRESSION
   ================================================================ */

function MiniBar({ value, max }) {
  const percentage =
    max > 0
      ? Math.min(100, Math.max(0, (value / max) * 100))
      : 0;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/* ================================================================
   DASHBOARD
   ================================================================ */

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState("30d");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [confirmTarget, setConfirmTarget] =
    useState(null);

  const [modalProduct, setModalProduct] =
    useState(undefined);

  const modalOpen =
    modalProduct !== undefined;

  /* ==============================================================
     CHARGEMENT PRODUITS
     ============================================================== */

  const loadProducts = async () => {
    setLoadingProducts(true);

    try {
      const data = await fetchProducts();

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Erreur chargement produits :",
        err
      );

      setError(
        err.message ||
          "Impossible de charger les produits."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ==============================================================
     CHARGEMENT COMMANDES
     ============================================================== */

  const loadOrders = async () => {
    setLoadingOrders(true);

    try {
      const result =
        await fetchAdminOrders();

      setOrders(
        Array.isArray(result?.orders)
          ? result.orders
          : []
      );

      setOrderStats(
        result?.stats || null
      );
    } catch (err) {
      console.error(
        "Erreur chargement commandes :",
        err
      );

      setError(
        err.message ||
          "Impossible de charger les commandes."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ==============================================================
     CHARGEMENT GLOBAL
     ============================================================== */

  const loadDashboard = async () => {
    setError("");

    await Promise.all([
      loadProducts(),
      loadOrders(),
    ]);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==============================================================
     RAFRAÎCHIR
     ============================================================== */

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setError("");

    try {
      await Promise.all([
        loadProducts(),
        loadOrders(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /* ==============================================================
     SUPPRESSION PRODUIT
     ============================================================== */

  const confirmDelete = async () => {
    if (!confirmTarget) {
      return;
    }

    const product =
      confirmTarget;

    setDeletingId(product.id);

    try {
      await deleteProduct(
        product.id
      );

      setProducts((previous) =>
        previous.filter(
          (item) =>
            item.id !== product.id
        )
      );

      setConfirmTarget(null);
    } catch (err) {
      console.error(
        "Erreur suppression produit :",
        err
      );

      setError(
        err.message ||
          "Impossible de supprimer le produit."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ==============================================================
     PRODUIT SAUVEGARDÉ
     ============================================================== */

  const handleSaved = () => {
    setModalProduct(undefined);

    loadProducts();
  };

  /* ==============================================================
     STATISTIQUES PRODUITS
     ============================================================== */

  const productStats =
    useMemo(() => {
      const lowStock =
        products.filter(
          (product) =>
            Number(product.stock) <= 5
        );

      const promotions =
        products.filter(
          (product) =>
            product.compareAtPrice
        );

      const newProducts =
        products.filter(
          (product) =>
            product.isNew
        );

      const featured =
        products.filter(
          (product) =>
            product.featured
        );

      return {
        total: products.length,
        lowStock: lowStock.length,
        promotions: promotions.length,
        newProducts: newProducts.length,
        featured: featured.length,
        lowStockProducts: lowStock,
      };
    }, [products]);

  /* ==============================================================
     TOP 5 DES PRODUITS LES PLUS VENDUS
     Calculé à partir des articles des commandes enregistrées.
     Les commandes annulées sont exclues.
     ============================================================== */

  const topSellingProducts = useMemo(() => {
    const totals = new Map();
    const normalizeStatus = (value) => String(value || "")
      .trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cancelledStatuses = new Set(["annulee", "cancelled", "canceled"]);

    orders.forEach((order) => {
      if (cancelledStatuses.has(normalizeStatus(order.status))) return;

      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const name = String(item.name || "Produit sans nom");
        const productId = item.productId ?? item.product_id;
        const catalogProduct = products.find((product) =>
          (productId != null && String(product.id) === String(productId)) ||
          String(product.name || "").trim().toLowerCase() === name.trim().toLowerCase()
        );
        const key = String(productId ?? name);
        const quantity = Math.max(0, Number(item.quantity || 0));
        const price = Math.max(0, Number(item.price || 0));
        if (!quantity) return;

        const current = totals.get(key) || {
          key,
          name,
          quantity: 0,
          revenue: 0,
          image: catalogProduct?.image || "",
          category: catalogProduct?.category || "",
        };
        current.quantity += quantity;
        current.revenue += price * quantity;
        if (!current.image && catalogProduct?.image) current.image = catalogProduct.image;
        if (!current.category && catalogProduct?.category) current.category = catalogProduct.category;
        totals.set(key, current);
      });
    });

    return Array.from(totals.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders, products]);

  const topSellingMaxQuantity = Math.max(
    1,
    ...topSellingProducts.map((product) => product.quantity)
  );

  /* ==============================================================
     STATISTIQUES COMMANDES
     ============================================================== */

  const revenue =
    Number(
      orderStats?.totalRevenue || 0
    );

  const totalOrders =
    Number(
      orderStats?.totalOrders ||
        orders.length ||
        0
    );

  const averageOrder =
    Number(
      orderStats?.averageOrder || 0
    );

  /* ==============================================================
     COMMANDES RÉCENTES
     ============================================================== */

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        )
        .slice(0, 5);
    }, [orders]);

  /* ==============================================================
     DONNÉES DES GRAPHIQUES : COMMANDES RÉELLES
     ============================================================== */
  const salesChartData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (salesPeriod === "12m") {
      const months = [];

      for (let offset = 11; offset >= 0; offset -= 1) {
        const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

        months.push({
          key,
          date: month.toLocaleDateString("fr-FR", { month: "short" }),
          revenue: 0,
          orders: 0,
        });
      }

      const monthMap = new Map(months.map((month) => [month.key, month]));

      orders.forEach((order) => {
        if (!order.createdAt) return;
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime())) return;

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const month = monthMap.get(key);

        if (month) {
          month.revenue += Number(order.total || 0);
          month.orders += 1;
        }
      });

      return months;
    }

    const dayCount = salesPeriod === "7d" ? 7 : 30;
    const days = [];

    for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);

      const key = [
        day.getFullYear(),
        String(day.getMonth() + 1).padStart(2, "0"),
        String(day.getDate()).padStart(2, "0"),
      ].join("-");

      days.push({
        key,
        date: day.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        revenue: 0,
        orders: 0,
      });
    }

    const dayMap = new Map(days.map((day) => [day.key, day]));

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      const day = dayMap.get(key);
      if (day) {
        day.revenue += Number(order.total || 0);
        day.orders += 1;
      }
    });

    return days;
  }, [orders, salesPeriod]);

  const salesPeriodLabel = {
    "7d": "7 derniers jours",
    "30d": "30 derniers jours",
    "12m": "12 derniers mois",
  }[salesPeriod];

  const salesPeriodRevenue = useMemo(
    () => salesChartData.reduce((sum, point) => sum + point.revenue, 0),
    [salesChartData]
  );

  const orderStatusChartData = useMemo(() => {
    const normalizeStatus = (value) => {
      const status = String(value || "").trim().toLowerCase();
      const aliases = {
        pending: "pending", "en attente": "pending",
        confirmed: "confirmed", confirmée: "confirmed", confirmee: "confirmed",
        processing: "processing", "en préparation": "processing", "en preparation": "processing",
        shipped: "shipped", expédiée: "shipped", expediee: "shipped",
        delivered: "delivered", livrée: "delivered", livree: "delivered",
        cancelled: "cancelled", canceled: "cancelled", annulée: "cancelled", annulee: "cancelled",
      };
      return aliases[status] || status;
    };
    const statuses = [
      { key: "pending", name: "En attente", color: "#f59e0b" },
      { key: "confirmed", name: "Confirmées", color: "#2563eb" },
      { key: "processing", name: "En préparation", color: "#8b5cf6" },
      { key: "shipped", name: "Expédiées", color: "#6366f1" },
      { key: "delivered", name: "Livrées", color: "#10b981" },
      { key: "cancelled", name: "Annulées", color: "#ef4444" },
    ];
    return statuses
      .map((status) => ({
        ...status,
        value: orders.filter((order) => normalizeStatus(order.status) === status.key).length,
      }))
      .filter((status) => status.value > 0);
  }, [orders]);
 
  /* ==============================================================
     PRODUITS AVEC STOCK FAIBLE
     ============================================================== */

  const lowStockProducts =
    productStats.lowStockProducts
      .slice()
      .sort(
        (a, b) =>
          Number(a.stock || 0) -
          Number(b.stock || 0)
      )
      .slice(0, 5);

  /* ==============================================================
     PRODUITS RÉCENTS
     ============================================================== */

  const recentProducts =
    products.slice(0, 5);

  return (
    <AdminLayout>
      <div className="admin-dashboard min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">

        {/* ======================================================
            HEADER
            ====================================================== */}
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                NOVAÉ / Administration
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Tableau de bord
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Vue d'ensemble de votre boutique NOVAÉ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* ACTUALISER */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>

              Actualiser
            </button>

            {/* AJOUTER PRODUIT */}
            <button
              type="button"
              onClick={() =>
                setModalProduct({})
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <PlusIcon />

              Ajouter un produit
            </button>

          </div>
        </div>

        {/* ======================================================
            ERREUR
            ====================================================== */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertIcon />

            <div className="flex-1">
              <p className="font-semibold">
                Une erreur est survenue
              </p>

              <p className="mt-0.5 text-xs text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 transition hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* ======================================================
            KPI
            ====================================================== */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Chiffre d'affaires"
            value={formatCurrency(
              revenue
            )}
            description="Revenus générés par les commandes"
            loading={loadingOrders}
            icon={<EuroIcon />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Commandes"
            value={totalOrders}
            description="Total des commandes enregistrées"
            loading={loadingOrders}
            icon={<ShoppingBagIcon />}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            label="Panier moyen"
            value={formatCurrency(
              averageOrder
            )}
            description="Valeur moyenne d'une commande"
            loading={loadingOrders}
            icon={<PackageIcon />}
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            label="Produits"
            value={productStats.total}
            description={`${productStats.lowStock} produit(s) avec stock faible`}
            loading={loadingProducts}
            icon={<PackageIcon />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

        </div>

        {/* ANALYSE DES VENTES */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
  {/* En-tête */}
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
    <div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
          Analytics · Ventes
        </span>
      </div>

      <h2 className="mt-2 font-display text-lg font-bold text-slate-950 dark:text-white">
        Évolution des ventes
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Suivi du chiffre d’affaires · données enregistrées
      </p>
    </div>

    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
      {[
        { value: "7d", label: "7 jours" },
        { value: "30d", label: "30 jours" },
        { value: "12m", label: "12 mois" },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setSalesPeriod(option.value)}
          aria-pressed={salesPeriod === option.value}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 ${
            salesPeriod === option.value
              ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>

  {/* Indicateurs financiers */}
  <div className="grid grid-cols-1 gap-3 px-5 pt-5 sm:grid-cols-3 sm:px-6">
    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Chiffre d'affaires
      </p>

      <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
        {formatCurrency(salesPeriodRevenue)}
      </p>

      <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
        Sur les {salesPeriodLabel}
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Commandes
      </p>

      <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
        {salesChartData.reduce((total, point) => total + point.orders, 0)}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        Commandes sur la période
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Panier moyen
      </p>

      <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
        {formatCurrency(
          salesChartData.reduce((total, point) => total + point.revenue, 0) /
            Math.max(
              salesChartData.reduce((total, point) => total + point.orders, 0),
              1
            )
        )}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        Chiffre d'affaires / commandes
      </p>
    </div>
  </div>

  {/* Graphique */}
  <div className="px-5 pb-5 pt-6 sm:px-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Performance financière
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Chiffre d'affaires des {salesPeriodLabel}
        </p>
      </div>

      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        Revenus
      </span>
    </div>

    {loadingOrders ? (
      <div className="h-64 animate-pulse rounded-xl bg-slate-50 dark:bg-slate-800" />
    ) : (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={salesChartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="novaeSalesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="90%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#94a3b8"
              strokeOpacity={0.15}
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />

            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={65}
              tickFormatter={(value) =>
                `${Number(value).toLocaleString("fr-FR")} €`
              }
            />

            <Tooltip
              formatter={(value, name) => [
                name === "revenue" ? formatCurrency(value) : value,
                name === "revenue" ? "Chiffre d'affaires" : "Commandes",
              ]}
              labelStyle={{
                color: "#0f172a",
                fontWeight: 700,
              }}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
                padding: "10px 14px",
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#novaeSalesGradient)"
              activeDot={{
                r: 6,
                stroke: "#ffffff",
                strokeWidth: 3,
                fill: "#2563eb",
              }}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}

    {!loadingOrders &&
      salesChartData.every((point) => point.orders === 0) && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aucune commande enregistrée sur les {salesPeriodLabel}.
          </p>
        </div>
      )}
  </div>
</section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3"><h2 className="font-display text-base font-bold text-slate-950">Répartition des commandes</h2><p className="mt-1 text-xs text-slate-400">Statuts des commandes enregistrées</p></div>
            {loadingOrders ? <div className="h-64 animate-pulse rounded-xl bg-slate-50" /> : orderStatusChartData.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBagIcon /></div><p className="mt-3 text-sm font-semibold text-slate-700">Aucune commande</p><p className="mt-1 text-xs text-slate-400">Le graphique apparaîtra dès la première commande.</p></div>
            ) : <>
              <div className="h-52 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={orderStatusChartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">{orderStatusChartData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} commande(s)`, name]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }} /></PieChart></ResponsiveContainer></div>
              <div className="mt-2 space-y-2">{orderStatusChartData.map((entry) => <div key={entry.key} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate">{entry.name}</span></span><span className="font-bold text-slate-900">{entry.value}</span></div>)}</div>
            </>}
          </section>
        </div>

        {/* ======================================================
            CONTENU PRINCIPAL
            ====================================================== */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">

          {/* ====================================================
              COMMANDES RÉCENTES
              ==================================================== */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>
                <h2 className="font-display text-base font-bold text-slate-950">
                  Commandes récentes
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Les dernières commandes de votre boutique
                </p>
              </div>

              <a
                href="/admin/commandes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-primary-dark"
              >
                Voir toutes
                <ArrowRightIcon />
              </a>

            </div>

            {loadingOrders ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100" />

                      <div className="flex-1">
                        <div className="h-3 w-32 rounded bg-slate-100" />
                        <div className="mt-2 h-2 w-20 rounded bg-slate-100" />
                      </div>

                      <div className="h-3 w-20 rounded bg-slate-100" />
                    </div>
                  )
                )}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingBagIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Aucune commande
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Les nouvelles commandes apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {recentOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6"
                    >

                      {/* RÉFÉRENCE */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <ShoppingBagIcon size={17} />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-slate-800">
                            {order.reference ||
                              `Commande #${String(
                                order.id
                              ).slice(0, 8)}`}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {order.customer?.name ||
                              order.customer?.email ||
                              "Client"}
                          </p>

                        </div>
                      </div>

                      {/* DATE */}
                      <div className="text-xs text-slate-400 sm:w-28">
                        {formatDate(
                          order.createdAt
                        )}
                      </div>

                      {/* STATUT */}
                      <div className="sm:w-32">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {getOrderStatusLabel(
                            order.status
                          )}
                        </span>
                      </div>

                      {/* TOTAL */}
                      <div className="text-left sm:w-28 sm:text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(
                            order.total
                          )}
                        </p>
                      </div>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

          {/* ====================================================
              ACTIVITÉ CATALOGUE
              ==================================================== */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5">
              <h2 className="font-display text-base font-bold text-slate-950">
                État du catalogue
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Vue rapide de vos produits
              </p>
            </div>

            <div className="space-y-5 p-5">

              {/* PRODUITS */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Produits
                  </span>

                  <span className="text-sm font-bold text-slate-950">
                    {productStats.total}
                  </span>
                </div>

                <MiniBar
                  value={productStats.total}
                  max={Math.max(
                    productStats.total,
                    10
                  )}
                />
              </div>

              {/* NOUVEAUTÉS */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Nouveautés
                  </span>

                  <span className="text-sm font-bold text-slate-950">
                    {productStats.newProducts}
                  </span>
                </div>

                <MiniBar
                  value={
                    productStats.newProducts
                  }
                  max={Math.max(
                    productStats.total,
                    1
                  )}
                />
              </div>

              {/* PRODUITS EN AVANT */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Mis en avant
                  </span>

                  <span className="text-sm font-bold text-slate-950">
                    {productStats.featured}
                  </span>
                </div>

                <MiniBar
                  value={
                    productStats.featured
                  }
                  max={Math.max(
                    productStats.total,
                    1
                  )}
                />
              </div>

              {/* PROMOTIONS */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    En promotion
                  </span>

                  <span className="text-sm font-bold text-slate-950">
                    {productStats.promotions}
                  </span>
                </div>

                <MiniBar
                  value={
                    productStats.promotions
                  }
                  max={Math.max(
                    productStats.total,
                    1
                  )}
                />
              </div>

              {/* STOCK FAIBLE */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <AlertIcon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-amber-900">
                        Stock faible
                      </p>

                      <span className="text-lg font-bold text-amber-700">
                        {productStats.lowStock}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Produit(s) avec 5 unités ou moins en stock.
                    </p>

                  </div>
                </div>

              </div>

            </div>
          </section>
        </div>

        {/* ======================================================
            BAS DU DASHBOARD
            ====================================================== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* ====================================================
              STOCK FAIBLE
              ==================================================== */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">

              <div>
                <h2 className="font-display text-base font-bold text-slate-950">
                  Stock à surveiller
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Produits nécessitant votre attention
                </p>
              </div>

              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                {productStats.lowStock} alerte(s)
              </span>

            </div>

            {loadingProducts ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-3"
                    >
                      <div className="h-11 w-11 rounded-xl bg-slate-100" />

                      <div className="flex-1">
                        <div className="h-3 w-40 rounded bg-slate-100" />
                        <div className="mt-2 h-2 w-24 rounded bg-slate-100" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Tout va bien
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Aucun produit n'est actuellement en stock faible.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {lowStockProducts.map(
                  (product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 px-5 py-4"
                    >

                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <PackageIcon size={16} />
                          </div>
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {product.category}
                        </p>

                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            Number(product.stock) ===
                            0
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {product.stock}
                        </p>

                        <p className="text-[10px] text-slate-400">
                          unité(s)
                        </p>
                      </div>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

          {/* ====================================================
              PRODUITS DU CATALOGUE
              ==================================================== */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">

              <div>
                <h2 className="font-display text-base font-bold text-slate-950">
                  Catalogue
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Accès rapide aux produits
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalProduct({})
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-primary-dark"
              >
                Ajouter
                <PlusIcon size={14} />
              </button>

            </div>

            {loadingProducts ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-3"
                    >
                      <div className="h-11 w-11 rounded-xl bg-slate-100" />

                      <div className="flex-1">
                        <div className="h-3 w-40 rounded bg-slate-100" />
                        <div className="mt-2 h-2 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Aucun produit
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setModalProduct({})
                  }
                  className="mt-3 text-xs font-bold text-primary"
                >
                  Ajouter le premier produit
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {recentProducts.map(
                  (product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                    >

                      {/* IMAGE */}
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <PackageIcon size={16} />
                          </div>
                        )}

                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {product.category} ·{" "}
                          {product.stock} en stock
                        </p>

                      </div>

                      {/* PRIX */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(
                            product.price
                          )}
                        </p>

                        {product.isNew && (
                          <span className="text-[10px] font-bold text-primary">
                            Nouveau
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 items-center gap-2">

                        {/* MODIFIER */}
                        <button
                          type="button"
                          onClick={() =>
                            setModalProduct(
                              product
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-primary"
                          aria-label={`Modifier ${product.name}`}
                          title="Modifier le produit"
                        >
                          <ChevronRightIcon />
                        </button>

                        {/* SUPPRIMER */}
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget(
                              product
                            )
                          }
                          disabled={
                            deletingId ===
                            product.id
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Supprimer ${product.name}`}
                          title="Supprimer le produit"
                        >
                          <TrashIcon />
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        </div>

        {/* ======================================================
            ACTIONS RAPIDES
            ====================================================== */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-950">
              Actions rapides
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Accédez rapidement aux principales sections.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <button
              type="button"
              onClick={() =>
                setModalProduct({})
              }
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                <PlusIcon />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Ajouter un produit
                </p>

                <p className="text-[11px] text-slate-400">
                  Créer un nouvel article
                </p>
              </div>
            </button>

            <a
              href="/admin/produits"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                <PackageIcon size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Gérer les produits
                </p>

                <p className="text-[11px] text-slate-400">
                  Voir tout le catalogue
                </p>
              </div>
            </a>

            <a
              href="/admin/commandes"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                <ShoppingBagIcon size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Gérer les commandes
                </p>

                <p className="text-[11px] text-slate-400">
                  Consulter les commandes
                </p>
              </div>
            </a>

            <a
              href="/admin/ventes"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                <EuroIcon size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Activité des ventes
                </p>

                <p className="text-[11px] text-slate-400">
                  Analyser les ventes
                </p>
              </div>
            </a>

          </div>
        </section>

      </div>

      {/* ========================================================
          TOP 5 — PRODUITS LES PLUS VENDUS
          ======================================================== */}
      <section className="admin-dashboard-top5 relative mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-7 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Performance commerciale
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Top 5 des meilleures ventes</h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                Découvrez les produits les plus vendus et leur contribution au chiffre d’affaires.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl shadow-lg backdrop-blur">↗</div>
          </div> 
          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Produits classés</p>
              <p className="mt-1 text-xl font-bold">{topSellingProducts.length}<span className="ml-1 text-sm font-medium text-slate-400">/ 5</span></p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Unités vendues</p>
              <p className="mt-1 text-xl font-bold">{topSellingProducts.reduce((sum, product) => sum + product.quantity, 0).toLocaleString("fr-FR")}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Revenus du Top 5</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(topSellingProducts.reduce((sum, product) => sum + product.revenue, 0))}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loadingOrders || loadingProducts ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-slate-100 p-4"><div className="h-40 rounded-xl bg-slate-100" /><div className="mt-4 h-4 w-3/4 rounded bg-slate-100" /><div className="mt-3 h-3 w-1/2 rounded bg-slate-100" /><div className="mt-5 h-2 rounded-full bg-slate-100" /></div>)}
            </div> 
          ) : topSellingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><PackageIcon size={28} /></div>
              <h3 className="mt-4 text-sm font-bold text-slate-800">Pas encore de ventes</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Les produits apparaîtront ici lorsque des commandes contenant des articles seront enregistrées.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topSellingProducts.map((product, index) => {
                const percentage = Math.min(100, (product.quantity / topSellingMaxQuantity) * 100);
                const rankStyles = [
                  "border-amber-200 bg-amber-50 text-amber-700",
                  "border-slate-300 bg-slate-100 text-slate-600",
                  "border-orange-200 bg-orange-50 text-orange-700",
                  "border-slate-200 bg-white text-slate-500",
                  "border-slate-200 bg-white text-slate-500",
                ];
                return (
                  <article key={product.key} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.06]">
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-5">
                      {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm"><PackageIcon size={30} /></div>}
                      <span className={`absolute left-3 top-3 flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-xs font-black shadow-sm ${rankStyles[index]}`}>{String(index + 1).padStart(2, "0")}</span>
                      {index === 0 && <span className="absolute right-3 top-3 rounded-full bg-slate-950 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">N° 1</span>}
                      {product.category && <span className="absolute bottom-3 left-3 max-w-[75%] truncate rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur">{product.category}</span>}
                    </div>
                    <div className="p-4">
                      <h3 className="min-h-10 text-sm font-bold leading-5 text-slate-900" title={product.name}>{product.name}</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quantité</p><p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{product.quantity.toLocaleString("fr-FR")}<span className="ml-1 text-[10px] font-medium text-slate-400">unité(s)</span></p></div>
                        <div className="rounded-xl bg-blue-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Revenus</p><p className="mt-1 break-words text-base font-bold tracking-tight text-blue-800">{formatCurrency(product.revenue)}</p></div>
                      </div>
                      <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-slate-500">Performance des ventes</span><span className="text-[10px] font-bold text-slate-700">{Math.round(percentage)} %</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-700 ${index === 0 ? "bg-gradient-to-r from-blue-600 to-indigo-500" : "bg-gradient-to-r from-slate-400 to-slate-500"}`} style={{ width: `${percentage}%` }} /></div></div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400"><span className="mt-px text-blue-500">ⓘ</span><p>Classement calculé à partir des quantités figurant dans les commandes enregistrées. Les commandes annulées sont exclues.</p></div>
        </div>
      </section>

      {/* ========================================================
          MODALE PRODUIT
          ======================================================== */}
      {modalOpen && (
        <ProductFormModal
          product={
            Object.keys(
              modalProduct
            ).length
              ? modalProduct
              : null
          }
          onClose={() =>
            setModalProduct(
              undefined
            )
          }
          onSaved={handleSaved}
        />
      )}

      {/* ========================================================
          CONFIRMATION SUPPRESSION
          ======================================================== */}
      <ConfirmDialog
        open={!!confirmTarget}
        title="Supprimer ce produit ?"
        message={
          confirmTarget
            ? `« ${confirmTarget.name} » sera définitivement retiré du catalogue. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        loading={
          deletingId ===
          confirmTarget?.id
        }
        onConfirm={
          confirmDelete
        }
        onCancel={() =>
          setConfirmTarget(null)
        }
      />
    </AdminLayout>
  );
} 