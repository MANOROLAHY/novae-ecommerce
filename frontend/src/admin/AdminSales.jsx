import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Euro,
  Package,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import AdminLayout from "./AdminLayout.jsx";
import { fetchAdminOrders } from "../context/api.js";

function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getOrderDate(order) {
  return new Date(order.createdAt || order.created_at || Date.now());
}

function isConfirmed(order) {
  const status = String(order.status || "").toLowerCase();

  return (
    status === "confirmed" ||
    status === "confirmée" ||
    status === "confirmee" ||
    status === "paid" ||
    status === "payée" ||
    status === "payee"
  );
}

function isCancelled(order) {
  const status = String(order.status || "").toLowerCase();

  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "annulée" ||
    status === "annulee"
  );
}

function getCustomerName(order) {
  return (
    order.customer?.name ||
    order.customer?.fullName ||
    order.customer?.firstName ||
    "Client"
  );
}

function getItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function getItemQuantity(item) {
  return Number(item.quantity || item.qty || 1);
}

function getItemName(item) {
  return item.name || item.productName || "Produit";
}

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("7");

  const [error, setError] = useState("");

  async function loadSales(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchAdminOrders();

      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Impossible de charger les données de ventes."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  const filteredOrders = useMemo(() => {
    const days = Number(period);
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return orders.filter((order) => {
      const date = getOrderDate(order);

      return date >= start && date <= now;
    });
  }, [orders, period]);

  const salesOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) => !isCancelled(order) && isConfirmed(order)
    );
  }, [filteredOrders]);

  const stats = useMemo(() => {
    const revenue = salesOrders.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

    const orderCount = salesOrders.length;

    const average = orderCount > 0 ? revenue / orderCount : 0;

    const units = salesOrders.reduce((total, order) => {
      return (
        total +
        getItems(order).reduce(
          (itemTotal, item) => itemTotal + getItemQuantity(item),
          0
        )
      );
    }, 0);

    return {
      revenue,
      orderCount,
      average,
      units,
    };
  }, [salesOrders]);

  const dailySales = useMemo(() => {
    const days = Number(period);
    const result = [];

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const total = salesOrders
        .filter((order) => {
          const orderDate = getOrderDate(order);
          return orderDate >= date && orderDate < nextDate;
        })
        .reduce((sum, order) => sum + Number(order.total || 0), 0);

      result.push({
        date,
        total,
        label: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
      });
    }

    return result;
  }, [salesOrders, period]);

  const maxDailySales = useMemo(() => {
    return Math.max(...dailySales.map((item) => item.total), 1);
  }, [dailySales]);

  const topProducts = useMemo(() => {
    const map = new Map();

    salesOrders.forEach((order) => {
      getItems(order).forEach((item) => {
        const name = getItemName(item);
        const quantity = getItemQuantity(item);

        if (!map.has(name)) {
          map.set(name, {
            name,
            quantity: 0,
            revenue: 0,
          });
        }

        const current = map.get(name);

        current.quantity += quantity;

        const itemPrice = Number(
          item.price || item.unitPrice || item.unit_price || 0
        );

        current.revenue += itemPrice * quantity;
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [salesOrders]);

  const recentSales = useMemo(() => {
    return [...salesOrders]
      .sort((a, b) => getOrderDate(b) - getOrderDate(a))
      .slice(0, 6);
  }, [salesOrders]);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1700px] space-y-8 px-5 py-6 sm:px-7 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
              <span>NOVAÉ</span>
              <span className="text-slate-300">/</span>
              <span>Ventes</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Activité des ventes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analysez le chiffre d'affaires et les performances de votre
              boutique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="7">7 derniers jours</option>
              <option value="14">14 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </select>

            <button
              type="button"
              onClick={() => loadSales(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualiser
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <RefreshCw size={30} className="animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Chargement des ventes...
            </p>
          </div>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Chiffre d'affaires
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {formatPrice(stats.revenue)}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Euro size={21} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Sur la période sélectionnée
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Commandes
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {stats.orderCount}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ShoppingBag size={21} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Commandes confirmées
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Panier moyen
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {formatPrice(stats.average)}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp size={21} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Chiffre d'affaires / commande
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Articles vendus
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {stats.units}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Package size={21} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Quantité totale vendue
                </p>
              </div>
            </div>

            {/* CHIFFRE D'AFFAIRES - FINTECH MODERNE */}
<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

  {/* En-tête */}
  <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
          NOVAÉ ANALYTICS
        </span>
      </div>

      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        Évolution du chiffre d'affaires
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Analyse des ventes confirmées sur la période sélectionnée.
      </p>
    </div>

    <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      <span className="text-xs font-bold text-emerald-700">
        Données réelles
      </span>
    </div>

  </div>

  {/* Statistiques */}
  <div className="grid gap-4 p-6 sm:grid-cols-3">

    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
      <p className="text-xs font-semibold text-blue-700">
        Chiffre d'affaires total
      </p>

      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
        {formatPrice(stats.revenue)}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Sur la période sélectionnée
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-xs font-semibold text-slate-500">
        Commandes confirmées
      </p>

      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
        {stats.orderCount}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        Transactions validées
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-xs font-semibold text-slate-500">
        Panier moyen
      </p>

      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
        {formatPrice(stats.average)}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        Revenu moyen par commande
      </p>
    </div>

  </div>

  {/* Graphique */}
  <div className="px-6 pb-6">

    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Performance financière
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Chiffre d'affaires journalier
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        Revenus (€)
      </div>

    </div>

    <div className="h-72 w-full">

      <ResponsiveContainer width="100%" height="100%">

        <AreaChart
          data={dailySales}
          margin={{ top: 15, right: 12, left: 8, bottom: 0 }}
        >

          <defs>
            <linearGradient
              id="novaeRevenueGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.30} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#e2e8f0"
            strokeDasharray="4 5"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={12}
          />

          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={75}
            tickFormatter={(value) =>
              `${Number(value).toLocaleString("fr-FR")} €`
            }
          />

          <Tooltip
            formatter={(value) => [
              formatPrice(value),
              "Chiffre d'affaires",
            ]}
            labelStyle={{
              color: "#0f172a",
              fontWeight: 700,
              marginBottom: 5,
            }}
            contentStyle={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "12px 15px",
              boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
            }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#2563eb"
            strokeWidth={3}
            fill="url(#novaeRevenueGradient)"
            activeDot={{
              r: 6,
              fill: "#2563eb",
              stroke: "#ffffff",
              strokeWidth: 3,
            }}
            animationDuration={1000}
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

    {salesOrders.length === 0 && (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-500">
          Aucune vente confirmée sur cette période.
        </p>
      </div>
    )}

  </div>

</section>

            {/* Bottom section */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Top products */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-950">
                    Produits les plus vendus
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Classement sur la période sélectionnée
                  </p>
                </div>

                {topProducts.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Aucune vente disponible sur cette période.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {topProducts.map((product, index) => (
                      <div
                        key={product.name}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {product.quantity} article
                            {product.quantity > 1 ? "s" : ""}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-slate-900">
                          {formatPrice(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent sales */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-950">
                    Ventes récentes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Dernières commandes confirmées
                  </p>
                </div>

                {recentSales.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Aucune vente disponible sur cette période.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentSales.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <ShoppingBag size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {order.reference || order.id}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {getCustomerName(order)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatPrice(order.total)}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {getOrderDate(order).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Empty period */}
            {salesOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <CalendarDays
                  size={32}
                  className="text-slate-400"
                />

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Aucune vente sur cette période
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Sélectionnez une période plus longue pour afficher
                  davantage de données.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
