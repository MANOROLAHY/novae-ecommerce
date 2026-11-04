import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "../context/api.js";
import AdminLayout from "./AdminLayout.jsx";

const STATUS_OPTIONS = [
  { value: "en attente", label: "En attente" },
  { value: "confirmée", label: "Confirmée" },
  { value: "expédiée", label: "Expédiée" },
  { value: "livrée", label: "Livrée" },
  { value: "annulée", label: "Annulée" },
];

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmées" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getStatusType(status) {
  const value = normalizeText(status);

  if (["pending", "en attente"].includes(value)) return "pending";
  if (["confirmed", "confirmee"].includes(value)) return "confirmed";
  if (["shipped", "expediee"].includes(value)) return "shipped";
  if (["delivered", "livree"].includes(value)) return "delivered";
  if (["cancelled", "canceled", "annulee"].includes(value)) {
    return "cancelled";
  }

  return "unknown";
}

function getStatusLabel(status) {
  const type = getStatusType(status);

  const labels = {
    pending: "En attente",
    confirmed: "Confirmée",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
    unknown: status || "Inconnu",
  };

  return labels[type];
}

function formatMoney(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "Date indisponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date indisponible";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCustomer(order) {
  return order?.customer ?? {};
}

function getCustomerName(order) {
  const customer = getCustomer(order);

  return (
    customer.name ||
    order?.customerName ||
    order?.name ||
    "Client"
  );
}

function getCustomerEmail(order) {
  const customer = getCustomer(order);

  return customer.email || order?.customerEmail || order?.email || "";
}

function getCustomerPhone(order) {
  const customer = getCustomer(order);

  return customer.phone || order?.customerPhone || order?.phone || "";
}

function getOrderReference(order) {
  return order?.reference || (order?.id != null ? `CMD-${order.id}` : "Commande");
}

function getOrderItems(order) {
  const items = order?.items || order?.products || order?.orderItems || [];

  return Array.isArray(items) ? items : [];
}

function getItemName(item) {
  return item?.name || item?.productName || item?.product?.name || "Produit";
}

function getItemQuantity(item) {
  const quantity = Number(item?.quantity ?? item?.qty ?? 1);

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getItemPrice(item) {
  const price = item?.price ?? item?.unitPrice ?? item?.product?.price ?? 0;
  const amount = Number(price);

  return Number.isFinite(amount) ? amount : 0;
}

function getOrderTotal(order) {
  const total = Number(order?.total ?? order?.totalAmount ?? order?.amount ?? 0);

  return Number.isFinite(total) ? total : 0;
}

function getItemCount(order) {
  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemQuantity(item),
    0
  );
}

function getAddress(order) {
  const customer = getCustomer(order);

  return [
    customer.address || order?.address,
    customer.postalCode || order?.postalCode,
    customer.city || order?.city,
    customer.country || order?.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function StatusBadge({ status }) {
  const type = getStatusType(status);

  const styles = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    shipped: "border-blue-200 bg-blue-50 text-blue-800",
    delivered: "border-indigo-200 bg-indigo-50 text-indigo-800",
    cancelled: "border-red-200 bg-red-50 text-red-800",
    unknown: "border-slate-200 bg-slate-100 text-slate-700",
  };

  const dots = {
    pending: "bg-amber-500",
    confirmed: "bg-emerald-500",
    shipped: "bg-blue-500",
    delivered: "bg-indigo-500",
    cancelled: "bg-red-500",
    unknown: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[type]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[type]}`} />
      {getStatusLabel(status)}
    </span>
  );
}

function StatCard({ title, value, detail, icon, accent = "slate" }) {
  const accentStyles = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {detail && (
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          )}
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accentStyles[accent]}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </article>
  );
}

function ProductRow({ item }) {
  const name = getItemName(item);
  const quantity = getItemQuantity(item);
  const price = getItemPrice(item);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
          📦
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-800">
            {name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Quantité : {quantity}
            {item?.size ? ` · Taille : ${item.size}` : ""}
            {item?.color ? ` · Couleur : ${item.color}` : ""}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatMoney(price)} / unité
          </p>
        </div>
      </div>

      <p className="shrink-0 text-sm font-bold text-slate-900">
        {formatMoney(price * quantity)}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-words text-sm font-medium text-slate-800 sm:max-w-[65%] sm:text-right">
        {value || "Non renseigné"}
      </span>
    </div>
  );
}

function OrderDetails({
  order,
  onClose,
  onStatusUpdate,
  updatingStatus,
  statusMessage,
}) {
  const [statusDraft, setStatusDraft] = useState(
    STATUS_OPTIONS.some((option) => option.value === order?.status)
      ? order.status
      : getStatusType(order?.status) === "pending"
        ? "en attente"
        : getStatusType(order?.status) === "confirmed"
          ? "confirmée"
          : getStatusType(order?.status) === "shipped"
            ? "expédiée"
            : getStatusType(order?.status) === "delivered"
              ? "livrée"
              : getStatusType(order?.status) === "cancelled"
                ? "annulée"
                : "en attente"
  );

  useEffect(() => {
    const type = getStatusType(order?.status);

    const valueByType = {
      pending: "en attente",
      confirmed: "confirmée",
      shipped: "expédiée",
      delivered: "livrée",
      cancelled: "annulée",
    };

    setStatusDraft(valueByType[type] || "en attente");
  }, [order]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const customer = getCustomer(order);
  const items = getOrderItems(order);
  const total = getOrderTotal(order);
  const currentStatus = getStatusType(order?.status);
  const draftStatus = getStatusType(statusDraft);
  const hasStatusChanged = currentStatus !== draftStatus;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              NOVAÉ · Administration
            </p>

            <h2
              id="order-detail-title"
              className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl"
            >
              {getOrderReference(order)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {formatDate(order?.createdAt || order?.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          {statusMessage && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                statusMessage.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
              role="status"
            >
              {statusMessage.text}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">
                Statut de la commande
              </h3>
              <StatusBadge status={order?.status} />
            </div>

            <label
              htmlFor="order-status"
              className="mt-5 block text-sm font-medium text-slate-600"
            >
              Modifier le statut
            </label>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <select
                id="order-status"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value)}
                disabled={updatingStatus}
                className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onStatusUpdate(order.id, statusDraft)}
                disabled={updatingStatus || !hasStatusChanged}
                className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {updatingStatus ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">
              Informations du client
            </h3>

            <div className="mt-3 divide-y divide-slate-100">
              <InfoRow label="Nom" value={getCustomerName(order)} />
              <InfoRow label="E-mail" value={getCustomerEmail(order)} />
              <InfoRow label="Téléphone" value={getCustomerPhone(order)} />
              <InfoRow label="Adresse" value={getAddress(order)} />
            </div>

            {getCustomerEmail(order) && (
              <a
                href={`mailto:${getCustomerEmail(order)}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Contacter le client
              </a>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">Produits commandés</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {getItemCount(order)} article(s)
              </span>
            </div>

            {items.length > 0 ? (
              <div className="mt-2">
                {items.map((item, index) => (
                  <ProductRow
                    key={item?.id ?? item?.productId ?? `${getItemName(item)}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <p className="py-5 text-sm text-slate-500">
                Aucun détail de produit disponible pour cette commande.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-600">
                Total de la commande
              </span>
              <span className="text-xl font-bold text-slate-900">
                {formatMoney(total)}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">
              Informations de commande
            </h3>

            <div className="mt-3 divide-y divide-slate-100">
              <InfoRow label="Référence" value={getOrderReference(order)} />
              <InfoRow label="Identifiant" value={order?.id} />
              <InfoRow label="Date" value={formatDate(order?.createdAt || order?.created_at)} />
              <InfoRow label="Statut actuel" value={getStatusLabel(order?.status)} />
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-200 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fermer les détails
          </button>
        </footer>
      </section>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        {hasFilters ? "⌕" : "▤"}
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">
        {hasFilters ? "Aucune commande trouvée" : "Aucune commande"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Essaie de modifier la recherche ou de choisir un autre statut."
          : "Les nouvelles commandes apparaîtront ici dès qu'elles seront disponibles."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState("");

  const loadOrders = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setLoadError("");

    try {
      const response = await fetchAdminOrders();

      const data = response?.data ?? response;
      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : [];

      setOrders(orderList);

      setSelectedOrder((current) => {
        if (!current) return null;

        return (
          orderList.find(
            (order) => String(order.id) === String(current.id)
          ) || null
        );
      });
    } catch (error) {
      console.error("Erreur de chargement des commandes :", error);

      setLoadError(
        error?.message ||
          "Impossible de récupérer les commandes. Vérifie ta connexion et tes droits administrateur."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(null), 4000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const counts = useMemo(() => {
    const result = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      const type = getStatusType(order?.status);

      if (Object.prototype.hasOwnProperty.call(result, type)) {
        result[type] += 1;
      }
    }

    return result;
  }, [orders]);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const query = normalizeText(search);

    return orders.filter((order) => {
      const customer = getCustomer(order);

      const searchableValues = [
        order?.id,
        order?.reference,
        getCustomerName(order),
        getCustomerEmail(order),
        getCustomerPhone(order),
        customer.address,
        customer.city,
        customer.postalCode,
        ...getOrderItems(order).map(getItemName),
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          normalizeText(value).includes(query)
        );

      const matchesStatus =
        statusFilter === "all" ||
        getStatusType(order?.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatusUpdate = async (orderId, status) => {
    if (updatingStatus) return;

    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      // Le backend accepte les statuts en français.
      await updateAdminOrderStatus(orderId, status);

      setStatusMessage({
        type: "success",
        text: "Le statut de la commande a été mis à jour.",
      });

      setToast({
        type: "success",
        text: "Statut de commande mis à jour avec succès.",
      });

      await loadOrders(false);
    } catch (error) {
      console.error("Erreur de modification du statut :", error);

      setStatusMessage({
        type: "error",
        text:
          error?.message ||
          "La modification du statut a échoué. Réessaie dans quelques instants.",
      });

      setToast({
        type: "error",
        text: error?.message || "Impossible de modifier le statut.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasFilters = Boolean(search.trim()) || statusFilter !== "all";

  return (
    <AdminLayout>
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              NOVAÉ · Administration
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Gestion des commandes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Suis les commandes, consulte les informations des clients et
              mets à jour leur statut depuis un espace centralisé.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(false)}
            disabled={refreshing || loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <span aria-hidden="true">{refreshing ? "↻" : "⟳"}</span>
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </header>

        {toast && (
          <div
            role="status"
            className={`fixed right-4 top-4 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${
              toast.type === "error"
                ? "border-red-200 bg-white text-red-800"
                : "border-emerald-200 bg-white text-emerald-800"
            }`}
          >
            {toast.text}
          </div>
        )}

        {loadError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">
              Impossible de charger les commandes
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => loadOrders(true)}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Réessayer
            </button>
          </section>
        )}

        <section
          aria-label="Statistiques des commandes"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Toutes les commandes"
            value={loading ? "…" : counts.all}
            detail="Commandes enregistrées"
            icon="▤"
            accent="slate"
          />

          <StatCard
            title="En attente"
            value={loading ? "…" : counts.pending}
            detail="Demandent une attention"
            icon="◷"
            accent="amber"
          />

          <StatCard
            title="Expédiées"
            value={loading ? "…" : counts.shipped}
            detail="Commandes en livraison"
            icon="↗"
            accent="blue"
          />

          <StatCard
            title="Chiffre d'affaires"
            value={loading ? "…" : formatMoney(revenue)}
            detail="Total des commandes enregistrées"
            icon="€"
            accent="emerald"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Toutes les commandes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Chargement des commandes…"
                    : `${filteredOrders.length} résultat(s) sur ${orders.length} commande(s)`}
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <label htmlFor="order-search" className="sr-only">
                  Rechercher une commande
                </label>

                <span
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                  aria-hidden="true"
                >
                  ⌕
                </span>

                <input
                  id="order-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Référence, client, e-mail, produit…"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                const count = counts[filter.value] ?? 0;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    aria-pressed={active}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3 py-8">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
                <p className="pt-3 text-center text-sm text-slate-500">
                  Chargement des commandes…
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                hasFilters={hasFilters}
                onReset={resetFilters}
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[850px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-4 font-semibold">Commande</th>
                        <th className="px-4 py-4 font-semibold">Client</th>
                        <th className="px-4 py-4 font-semibold">Date</th>
                        <th className="px-4 py-4 font-semibold">Statut</th>
                        <th className="px-4 py-4 text-right font-semibold">
                          Total
                        </th>
                        <th className="px-4 py-4 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id ?? order.reference}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-5">
                            <p className="font-bold text-slate-900">
                              {getOrderReference(order)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {getItemCount(order)} article(s)
                            </p>
                          </td>

                          <td className="px-4 py-5">
                            <p className="font-semibold text-slate-800">
                              {getCustomerName(order)}
                            </p>
                            <p className="mt-1 max-w-[220px] break-words text-xs text-slate-500">
                              {getCustomerEmail(order) || "E-mail non renseigné"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-600">
                            {formatDate(order.createdAt || order.created_at)}
                          </td>

                          <td className="px-4 py-5">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-right font-bold text-slate-900">
                            {formatMoney(getOrderTotal(order))}
                          </td>

                          <td className="px-4 py-5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setStatusMessage(null);
                              }}
                              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
                  {filteredOrders.map((order) => (
                    <article
                      key={order.id ?? order.reference}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-900">
                            {getOrderReference(order)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(order.createdAt || order.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="font-semibold text-slate-800">
                          {getCustomerName(order)}
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {getCustomerEmail(order) || "E-mail non renseigné"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            {getItemCount(order)} article(s)
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {formatMoney(getOrderTotal(order))}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusMessage(null);
                          }}
                          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          Voir la commande
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="flex flex-col gap-1 border-t border-slate-200 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>NOVAÉ · Espace de gestion des commandes</p>
          <p>
            {loading
              ? "Synchronisation des données…"
              : `${orders.length} commande(s) chargée(s)`}
          </p>
        </footer>
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setStatusMessage(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          updatingStatus={updatingStatus}
          statusMessage={statusMessage}
        />
      )}
       </main>
    </AdminLayout>
  );
}