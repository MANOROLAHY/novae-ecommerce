import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  Eye,
  Star,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";

import AdminLayout from "./AdminLayout.jsx";
import ProductFormModal from "./ProductFormModal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

import {
  fetchProducts,
  fetchCategories,
  deleteProduct,
} from "../context/api.js";

function formatPrice(value, currency = "EUR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getImageUrl(image) {
  if (!image) return null;

  if (
    image.startsWith("/uploads/") ||
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:image/")
  ) {
    return image;
  }

  return null;
}

function StockBadge({ stock }) {
  if (Number(stock) <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Rupture
      </span>
    );
  }

  if (Number(stock) <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Stock faible · {stock}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      En stock · {stock}
    </span>
  );
}

function ProductImage({ product }) {
  const image = getImageUrl(product.image);

  if (image) {
    return (
      <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
      <Package size={25} strokeWidth={1.7} />
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <Package size={28} />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        Aucun produit trouvé
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Aucun produit ne correspond à votre recherche. Vous pouvez également
        ajouter votre premier produit au catalogue.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus size={18} />
        Ajouter un produit
      </button>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadProducts(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData?.categories || []
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message || "Impossible de charger les produits.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        String(product.name || "").toLowerCase().includes(normalizedSearch) ||
        String(product.ref || "").toLowerCase().includes(normalizedSearch) ||
        String(product.category || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(product.subcategory || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        category === "all" ||
        String(product.category || "").trim() === category;

      const stock = Number(product.stock || 0);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && stock > 0) ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  const stats = useMemo(() => {
    return {
      total: products.length,

      available: products.filter(
        (product) => Number(product.stock || 0) > 0
      ).length,

      lowStock: products.filter((product) => {
        const stock = Number(product.stock || 0);
        return stock > 0 && stock <= 5;
      }).length,

      outOfStock: products.filter(
        (product) => Number(product.stock || 0) <= 0
      ).length,

      newProducts: products.filter((product) => product.isNew).length,
    };
  }, [products]);

  function handleAdd() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleFormSuccess(message) {
    handleFormClose();

    await loadProducts(true);

    showToast(message || "Produit enregistré avec succès.");
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteProduct(deleteTarget.id);

      setProducts((current) =>
        current.filter((product) => product.id !== deleteTarget.id)
      );

      setDeleteTarget(null);

      showToast("Produit supprimé avec succès.");
    } catch (error) {
      console.error(error);

      showToast(
        error.message || "Impossible de supprimer le produit.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1750px] space-y-9 px-5 py-8 text-slate-900 dark:text-slate-100 sm:px-7 lg:px-9 xl:px-10 2xl:px-12">

        {/* HEADER */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              <span>NOVAÉ</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span>Catalogue</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[34px]">
              Produits
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Gérez votre catalogue, vos stocks et vos produits.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualiser
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              <Plus size={18} />
              Ajouter un produit
            </button>
          </div>
        </div>

        {/* STATISTIQUES */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Catalogue
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {stats.total}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              produits
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Disponibles
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.available}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              avec du stock
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Stock faible
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.lowStock}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              ≤ 5 unités
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Ruptures
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {stats.outOfStock}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              sans stock
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Nouveautés
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {stats.newProducts}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              nouveaux produits
            </p>
          </div>
        </div>

        {/* CATALOGUE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

          {/* TOOLBAR */}

          <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-700 lg:px-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Catalogue produits
                </h2>

                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {filteredProducts.length} produit
                  {filteredProducts.length > 1 ? "s" : ""} affiché
                  {filteredProducts.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                {/* Recherche */}

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un produit..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 md:w-72"
                  />
                </div>

                {/* Catégorie */}

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                >
                  <option value="all">Toutes les catégories</option>

                  {categories.map((item) => {
                    const value =
                      typeof item === "string"
                        ? item
                        : item?.category || item?.name;

                    if (!value) return null;

                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>

                {/* Stock */}

                <select
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                >
                  <option value="all">Tous les stocks</option>
                  <option value="available">En stock</option>
                  <option value="low">Stock faible</option>
                  <option value="out">Rupture</option>
                </select>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <RefreshCw
                size={28}
                className="animate-spin text-blue-600"
              />

              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                Chargement du catalogue...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <>
              {/* TABLEAU DESKTOP */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-left dark:border-slate-700 dark:bg-slate-800/70">
                      <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Produit
                      </th>

                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Catégorie
                      </th>

                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Prix
                      </th>

                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Statut
                      </th>

                      <th className="px-7 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                      >
                        {/* Produit */}

                        <td className="px-7 py-6">
                          <div className="flex items-center gap-4">
                            <ProductImage product={product} />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {product.name}
                                </p>

                                {product.isNew && (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    <Sparkles size={10} />
                                    Nouveau
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                Réf. {product.ref || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Catégorie */}

                        <td className="px-5 py-6">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {product.category || "—"}
                            </p>

                            {product.subcategory && (
                              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                {product.subcategory}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Prix */}

                        <td className="px-5 py-6">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatPrice(product.price, product.currency)}
                          </p>

                          {product.compareAtPrice && (
                            <p className="mt-1.5 text-xs text-slate-400 line-through dark:text-slate-500">
                              {formatPrice(
                                product.compareAtPrice,
                                product.currency
                              )}
                            </p>
                          )}
                        </td>

                        {/* Stock */}

                        <td className="px-5 py-6">
                          <StockBadge stock={product.stock} />
                        </td>

                        {/* Statut */}

                        <td className="px-5 py-6">
                          <div className="flex flex-wrap gap-2">
                            {product.featured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <Star size={11} />
                                Vedette
                              </span>
                            )}

                            {product.isNew && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <Sparkles size={11} />
                                Nouveau
                              </span>
                            )}

                            {!product.featured && !product.isNew && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Standard
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}

                        <td className="px-7 py-6">
                          <div className="flex justify-end gap-2.5">
                            <button
                              type="button"
                              title="Voir le produit"
                              onClick={() =>
                                window.open(
                                  `/produit/${product.id}`,
                                  "_blank"
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => handleEdit(product)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              title="Supprimer"
                              onClick={() => setDeleteTarget(product)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex gap-4">
                      <ProductImage product={product} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">
                              {product.name}
                            </h3>

                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                              {product.category || "Sans catégorie"}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatPrice(product.price, product.currency)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <StockBadge stock={product.stock} />

                          {product.isNew && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                              <Sparkles size={11} />
                              Nouveau
                            </span>
                          )}
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/produit/${product.id}`,
                                "_blank"
                              )
                            }
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={15} />
                            Voir
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          >
                            <Pencil size={15} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ALERTE STOCK */}

        {stats.lowStock > 0 && (
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                Attention au stock
              </p>

              <p className="mt-1.5 text-sm leading-6 text-amber-700 dark:text-amber-400">
                {stats.lowStock} produit
                {stats.lowStock > 1 ? "s ont" : " a"} un stock faible.
                Pensez à réapprovisionner votre catalogue.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PRODUIT */}

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* CONFIRMATION SUPPRESSION */}

      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Supprimer le produit ?"
          message={`Le produit « ${
            deleteTarget.name || "ce produit"
          } » sera définitivement supprimé du catalogue.`}
          confirmLabel={deleting ? "Suppression..." : "Supprimer"}
          cancelLabel="Annuler"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
        />
      )}

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-2xl dark:bg-slate-900 ${
              toast.type === "error"
                ? "border-red-200 dark:border-red-500/30"
                : "border-emerald-200 dark:border-emerald-500/30"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type === "error"
                  ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              }`}
            >
              {toast.type === "error" ? (
                <X size={16} />
              ) : (
                <span className="text-sm font-bold">✓</span>
              )}
            </div>

            <p className="pt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}