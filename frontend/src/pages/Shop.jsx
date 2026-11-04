import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, fetchCategories } from "../context/api.js";
import ProductCard from "../components/ProductCard.jsx";

function SearchIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function SlidersIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function XIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ChevronDownIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-2xl bg-black/[0.05]" />

      <div className="mt-4 space-y-2 px-1">
        <div className="h-2.5 w-20 rounded-full bg-black/[0.06]" />
        <div className="h-4 w-3/4 rounded-full bg-black/[0.07]" />
        <div className="h-3 w-20 rounded-full bg-black/[0.05]" />
      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full rounded-xl px-3.5 py-2.5 text-left text-sm
        transition-all duration-200
        ${
          active
            ? "bg-ink text-paper font-semibold"
            : "text-ink/65 hover:bg-black/[0.035] hover:text-ink"
        }
      `}
    >
      {children}

      {active && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-accent" />
      )}
    </button>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(
    params.get("search") || ""
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = params.get("category") || "";
  const subcategory = params.get("subcategory") || "";
  const search = params.get("search") || "";
  const isNew = params.get("isNew") || "";
  const sort = params.get("sort") || "";

  // ---------------------------------------------------------------------------
  // Chargement des catégories
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    fetchCategories()
      .then((data) => {
        if (mounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setCategories([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Chargement des produits
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);

      const query = {};

      if (category) {
        query.category = category;
      }

      if (subcategory) {
        query.subcategory = subcategory;
      }

      if (search) {
        query.search = search;
      }

      if (isNew) {
        query.isNew = isNew;
      }

      if (sort) {
        query.sort = sort;
      }

      try {
        const data = await fetchProducts(query);

        if (mounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [category, subcategory, search, isNew, sort]);

  // ---------------------------------------------------------------------------
  // Synchronisation du champ recherche
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // ---------------------------------------------------------------------------
  // Catégorie active
  // ---------------------------------------------------------------------------

  const currentCategory = useMemo(() => {
    return categories.find((item) => item.category === category);
  }, [categories, category]);

  const currentSubs = currentCategory?.subcategories || [];

  // ---------------------------------------------------------------------------
  // Mise à jour URL
  // ---------------------------------------------------------------------------

  function update(key, value) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key === "category") {
      next.delete("subcategory");
    }

    setParams(next);
  }

  // ---------------------------------------------------------------------------
  // Recherche
  // ---------------------------------------------------------------------------

  function submitSearch(event) {
    event.preventDefault();

    const value = searchInput.trim();

    update("search", value);
  }

  function clearSearch() {
    setSearchInput("");
    update("search", "");
  }

  // ---------------------------------------------------------------------------
  // Réinitialisation
  // ---------------------------------------------------------------------------

  function resetFilters() {
    setSearchInput("");
    setParams({});
    setMobileFiltersOpen(false);
  }

  const hasFilters =
    Boolean(category) ||
    Boolean(subcategory) ||
    Boolean(search) ||
    Boolean(isNew) ||
    Boolean(sort);

  return (
    <div className="min-h-screen bg-paper">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative overflow-hidden border-b hairline bg-cream">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-black/[0.045]" />
        <div className="absolute -right-4 -top-12 h-64 w-64 rounded-full border border-black/[0.045]" />

        <div className="relative mx-auto max-w-[1500px] px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-14">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest2 text-accent">
              <span className="h-px w-7 bg-accent" />
              NOVAÉ / Boutique
            </div>

            <h1 className="mt-5 font-display text-5xl font-extrabold tracking-tightest leading-[0.92] md:text-7xl">
              {category || "Toutes les pièces"}
              {isNew && (
                <>
                  <br />
                  <span className="text-accent">nouveautés.</span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-gray md:text-base">
              Une sélection pensée pour un quotidien moderne. Des pièces
              essentielles, des détails soignés et une esthétique NOVAÉ
              reconnaissable.
            </p>
          </div>

          {/* Recherche */}
          <form
            onSubmit={submitSearch}
            className="mt-9 flex max-w-2xl items-center rounded-full border border-black/10 bg-paper p-1.5 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <span className="shrink-0 text-gray">
                <SearchIcon />
              </span>

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Rechercher une pièce..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="shrink-0 rounded-full p-1.5 text-gray transition-colors hover:bg-black/[0.05] hover:text-ink"
                  aria-label="Effacer la recherche"
                >
                  <XIcon />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[10px] font-bold uppercase tracking-widest2 text-paper transition-transform duration-200 hover:scale-[1.02]"
            >
              Rechercher
              <ArrowRightIcon size={14} />
            </button>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENU                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 md:py-12">
        {/* Barre supérieure */}
        <div className="mb-7 flex flex-col gap-4 border-b hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray">
              {loading
                ? "Chargement..."
                : `${products.length} pièce${products.length > 1 ? "s" : ""}`}
            </span>

            {category && (
              <span className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest2">
                {category}
              </span>
            )}

            {isNew && (
              <span className="rounded-full bg-accent/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest2 text-accent">
                Nouveautés
              </span>
            )}

            {search && (
              <span className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest2">
                « {search} »
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-bold uppercase tracking-widest2 text-gray underline underline-offset-4 transition-colors hover:text-ink"
              >
                Réinitialiser
              </button>
            )}

            {/* Filtre mobile */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border hairline bg-cream px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest2 lg:hidden"
            >
              <SlidersIcon size={15} />
              Filtres
            </button>

            <label className="hidden items-center gap-2 lg:flex">
              <span className="text-[10px] font-bold uppercase tracking-widest2 text-gray">
                Trier
              </span>

              <span className="relative">
                <select
                  value={sort}
                  onChange={(event) =>
                    update("sort", event.target.value)
                  }
                  className="appearance-none rounded-full border hairline bg-cream py-2.5 pl-4 pr-9 text-xs outline-none transition-colors hover:border-black/20"
                >
                  <option value="">Pertinence</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="name">Nom A–Z</option>
                </select>

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronDownIcon size={13} />
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* FILTRES MOBILE                                                   */}
        {/* ---------------------------------------------------------------- */}

        {mobileFiltersOpen && (
          <div className="mb-8 rounded-2xl border hairline bg-cream p-5 lg:hidden">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest2">
                Filtres
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 text-gray hover:bg-black/[0.05] hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-3 text-[9px] font-bold uppercase tracking-widest2 text-gray">
                  Catégories
                </div>

                <div className="grid gap-1">
                  <FilterButton
                    active={!category}
                    onClick={() => update("category", "")}
                  >
                    Toutes les pièces
                  </FilterButton>

                  {categories.map((item) => (
                    <FilterButton
                      key={item.category}
                      active={category === item.category}
                      onClick={() => update("category", item.category)}
                    >
                      {item.category}
                    </FilterButton>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-[9px] font-bold uppercase tracking-widest2 text-gray">
                  Affichage
                </div>

                <div className="grid gap-1">
                  <FilterButton
                    active={Boolean(isNew)}
                    onClick={() => update("isNew", isNew ? "" : "1")}
                  >
                    Nouveautés
                  </FilterButton>
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-widest2 text-gray">
                    Trier
                  </div>

                  <select
                    value={sort}
                    onChange={(event) =>
                      update("sort", event.target.value)
                    }
                    className="w-full rounded-xl border hairline bg-paper px-3 py-3 text-sm outline-none"
                  >
                    <option value="">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">
                      Prix décroissant
                    </option>
                    <option value="name">Nom A–Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* GRILLE + SIDEBAR                                                 */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid gap-10 lg:grid-cols-[225px_1fr]">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="text-[10px] font-bold uppercase tracking-widest2 text-gray">
                Explorer
              </div>

              <div className="mt-4 rounded-2xl border hairline bg-cream p-3">
                <FilterButton
                  active={!category && !isNew}
                  onClick={() => {
                    setParams({});
                    setSearchInput("");
                  }}
                >
                  Toutes les pièces
                </FilterButton>

                <div className="my-3 h-px bg-black/[0.06]" />

                {categories.map((item) => (
                  <FilterButton
                    key={item.category}
                    active={category === item.category}
                    onClick={() => update("category", item.category)}
                  >
                    {item.category}
                  </FilterButton>
                ))}

                <div className="my-3 h-px bg-black/[0.06]" />

                <FilterButton
                  active={Boolean(isNew)}
                  onClick={() =>
                    update("isNew", isNew ? "" : "1")
                  }
                >
                  Nouveautés
                </FilterButton>
              </div>

              {/* Sous-catégories */}
              {currentSubs.length > 0 && (
                <div className="mt-8">
                  <div className="text-[10px] font-bold uppercase tracking-widest2 text-gray">
                    {category}
                  </div>

                  <div className="mt-3 rounded-2xl border hairline bg-cream p-3">
                    <FilterButton
                      active={!subcategory}
                      onClick={() => update("subcategory", "")}
                    >
                      Toutes
                    </FilterButton>

                    {currentSubs.map((item) => (
                      <FilterButton
                        key={item}
                        active={subcategory === item}
                        onClick={() =>
                          update("subcategory", item)
                        }
                      >
                        {item}
                      </FilterButton>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 border-t hairline pt-6">
                <div className="text-[9px] font-bold uppercase tracking-widest2 text-gray">
                  NOVAÉ
                </div>

                <p className="mt-3 text-xs leading-6 text-gray">
                  Des essentiels contemporains sélectionnés avec
                  attention.
                </p>
              </div>
            </div>
          </aside>

          {/* Produits */}
          <section className="min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-12">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border hairline bg-cream px-6 text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border hairline bg-paper">
                    <SearchIcon size={22} />
                  </div>

                  <div className="mt-6 font-display text-2xl font-bold md:text-3xl">
                    Aucune pièce trouvée.
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray">
                    Nous n'avons trouvé aucun produit correspondant à
                    votre recherche ou à vos filtres.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest2 text-paper transition-transform hover:scale-[1.02]"
                  >
                    Voir toute la boutique
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-5 md:gap-y-14">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="min-w-0 transition-transform duration-300 hover:-translate-y-1"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                <div className="mt-14 flex justify-center border-t hairline pt-8">
                  <div className="text-center">
                    <div className="text-[9px] font-bold uppercase tracking-widest2 text-gray">
                      NOVAÉ
                    </div>

                    <p className="mt-2 text-xs text-gray">
                      Vous avez parcouru toute la sélection disponible.
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
