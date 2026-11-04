import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const NAV = [
  { label: "Nouveautés", to: "/boutique?isNew=true", key: "new" },
  { label: "Mode", to: "/boutique?category=Mode", key: "mode" },
  { label: "Tech", to: "/boutique?category=Électronique", key: "tech" },
  { label: "Boutique", to: "/boutique", key: "shop" },
];

function Icon({ name, size = 19 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.7-3.5 3-5.2 6.5-5.2s5.8 1.7 6.5 5.2" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

export default function Header() {
  const { cart } = useCart();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const menuButtonRef = useRef(null);

  const isShop =
    location.pathname.startsWith("/boutique") ||
    location.pathname.startsWith("/produit");

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();

    const value = query.trim();
    if (!value) {
      searchInputRef.current?.focus();
      return;
    }

    navigate(`/boutique?search=${encodeURIComponent(value)}`);
    setQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, searchOpen]);

  const linkClass = ({ isActive }) =>
    [
      "novae-link relative py-2 text-[11px] lg:text-xs uppercase",
      "tracking-widest2 font-semibold transition-colors duration-200",
      isActive ? "active text-ink" : "text-gray hover:text-ink",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b hairline bg-paper/95 backdrop-blur-xl">
      <div className="bg-ink px-3 py-2.5 text-center text-[9px] sm:text-[10px] uppercase tracking-widest2 text-paper">
        <span>Livraison offerte dès 150 €</span>
        <span className="mx-2 opacity-40" aria-hidden="true">
          •
        </span>
        <span>Retours sous 30 jours</span>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-5 md:px-8">
        <div className="flex h-[68px] items-center justify-between gap-3 md:h-[76px] md:gap-5">
          <button
            ref={menuButtonRef}
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="novae-mobile-navigation"
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={21} />
          </button>

          <Link
            to="/"
            className="shrink-0 leading-none"
            aria-label="NOVAÉ, accueil"
          >
            <span className="block font-display text-[20px] font-extrabold tracking-[-.06em] sm:text-[22px]">
              NOVAÉ
            </span>
            <span className="mt-1 block text-[7px] uppercase tracking-[.25em] text-gray sm:text-[8px] sm:tracking-[.32em]">
              Modern essentials
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="ml-6 hidden items-center gap-6 lg:gap-9 md:flex"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.key === "shop"}
                className={({ isActive }) => {
                  const active =
                    item.key === "shop"
                      ? isShop && !location.search.includes("isNew=true") &&
                        !location.search.includes("category=")
                      : isActive;

                  return linkClass({ isActive: active });
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
            <button
              type="button"
              className={[
                "flex h-10 w-10 items-center justify-center rounded-full",
                "transition-colors hover:bg-surface hover:text-accent",
                searchOpen ? "bg-surface text-accent" : "text-ink",
              ].join(" ")}
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Fermer la recherche" : "Rechercher"}
              aria-expanded={searchOpen}
              aria-controls="novae-search-form"
            >
              <Icon name={searchOpen ? "close" : "search"} />
            </button>

            <Link
              to="/panier"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface hover:text-accent"
              aria-label={
                cart?.count > 0
                  ? `Panier, ${cart.count} article${cart.count > 1 ? "s" : ""}`
                  : "Panier"
              }
            >
              <Icon name="bag" />

              {cart?.count > 0 && (
                <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sale px-1 text-[9px] font-bold text-white ring-2 ring-paper">
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              )}
            </Link>

            <Link
              to="/compte"
              className="hidden items-center gap-2 rounded-full border hairline px-4 py-2 text-[10px] font-semibold uppercase tracking-widest2 transition-colors hover:border-ink hover:bg-ink hover:text-paper sm:flex"
            >
              <Icon name="user" size={16} />
              <span>Compte</span>
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form
            id="novae-search-form"
            role="search"
            onSubmit={submitSearch}
            className="pb-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border hairline bg-cream px-3 py-2.5 sm:px-4 sm:py-3">
              <Icon name="search" size={17} />

              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un produit..."
                aria-label="Rechercher un produit"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-gray/70"
              />

              <button
                type="submit"
                className="rounded-full bg-ink px-3 py-2 text-[9px] font-bold uppercase tracking-widest2 text-white transition-colors hover:bg-accent sm:px-4"
              >
                Rechercher
              </button>
            </div>
          </form>
        )}

        {mobileOpen && (
          <div
            id="novae-mobile-navigation"
            className="border-t hairline pb-5 pt-4 md:hidden"
          >
            <nav aria-label="Navigation mobile" className="grid gap-1">
              {NAV.map((item) => {
                const active =
                  item.key === "shop"
                    ? isShop &&
                      !location.search.includes("isNew=true") &&
                      !location.search.includes("category=")
                    : item.key === "new"
                      ? location.search.includes("isNew=true")
                      : item.key === "mode"
                        ? location.search.includes("category=Mode")
                        : location.search.includes("category=") &&
                          location.search.includes("Électronique");

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-accent-dim text-accent"
                        : "text-ink hover:bg-surface",
                    ].join(" ")}
                  >
                    <span className="flex items-center justify-between">
                      {item.label}
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </span>
                  </Link>
                );
              })}

              <Link
                to="/compte"
                onClick={closeMobileMenu}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface"
              >
                Mon compte
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}