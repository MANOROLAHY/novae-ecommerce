import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import { adminLogout } from "../context/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

/* ================================================================
   NAVIGATION ADMIN
   ================================================================ */

const NAVIGATION = [
  {
    label: "Tableau de bord",
    to: "/admin",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Produits",
    to: "/admin/produits",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </svg>
    ),
  },
  {
    label: "Commandes",
    to: "/admin/commandes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2.5h12a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    label: "Activité des ventes",
    to: "/admin/ventes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5" />
        <path d="M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
        <path d="M17 6h3v3" />
      </svg>
    ),
  },
  {
    label: "Profil administrateur",
    to: "/admin/profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
      </svg>
    ),
  },
];

/* ================================================================
   INITIALISATION DU THÈME
   ================================================================ */

function getInitialDarkMode() {
  try {
    return localStorage.getItem("novae-admin-theme") === "dark";
  } catch {
    return false;
  }
}

/* ================================================================
   ICÔNES
   ================================================================ */

function MenuIcon({ children }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/65">
      <span className="h-[18px] w-[18px]">{children}</span>
    </span>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    </svg>
  );
}

/* ================================================================
   BOUTON DE THÈME
   ================================================================ */

function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
      aria-pressed={darkMode}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
        {darkMode ? <SunIcon /> : <MoonIcon />}
      </span>

      <span className="flex-1">
        {darkMode ? "Mode clair" : "Mode sombre"}
      </span>

      <span
        className={[
          "relative h-6 w-11 rounded-full transition-colors",
          darkMode ? "bg-primary" : "bg-white/20",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
            darkMode ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

/* ================================================================
   CONTENU SIDEBAR
   ================================================================ */

function SidebarContent({
  onNavigate,
  onRequestLogout,
  darkMode,
  onToggleTheme,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-6">
        <Link to="/admin" onClick={onNavigate} className="block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="font-display text-lg font-bold">N</span>
            </div>

            <div>
              <div className="font-display text-[15px] font-bold tracking-[0.18em] text-white">
                NOVAÉ
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
                Administration
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
          Navigation
        </div>

        <nav className="space-y-1">
          {NAVIGATION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5",
                  "text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-ink shadow-sm"
                    : "text-white/60 hover:bg-white/[0.07] hover:text-white",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <MenuIcon>
                    {React.cloneElement(item.icon, {
                      className: isActive ? "text-primary" : "",
                      width: 18,
                      height: 18,
                    })}
                  </MenuIcon>

                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />

        <Link
          to="/"
          onClick={onNavigate}
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m3 10 9-7 9 7" />
              <path d="M5 9.5V21h14V9.5" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </span>
          <span>Voir la boutique</span>
        </Link>

        <button
          type="button"
          onClick={onRequestLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/55 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M20 19V5a2 2 0 0 0-2-2h-5" />
            </svg>
          </span>
          <span>Déconnexion</span>
        </button>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-white/55">
              Session administrateur
            </span>
          </div>

          <div className="mt-1 pl-4 text-[10px] text-white/25">
            Connexion sécurisée
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ADMIN LAYOUT
   ================================================================ */

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navigate = useNavigate();

  // Mémorise le thème qui existait avant l'entrée dans l'administration.
  const previousDarkClass = useRef(null);

  /* ================================================================
     SAUVEGARDE ET RESTAURATION DU THÈME GLOBAL
     ================================================================ */

  useEffect(() => {
    previousDarkClass.current =
      document.documentElement.classList.contains("dark");

    return () => {
      document.documentElement.classList.toggle(
        "dark",
        previousDarkClass.current === true
      );
    };
  }, []);

  /* ================================================================
     APPLICATION DU THÈME ADMIN
     ================================================================ */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    try {
      localStorage.setItem(
        "novae-admin-theme",
        darkMode ? "dark" : "light"
      );
    } catch (error) {
      console.warn("Impossible de sauvegarder le thème :", error);
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  /* ================================================================
     DÉCONNEXION
     ================================================================ */

  const requestLogout = () => {
    if (!logoutLoading) {
      setShowLogoutConfirm(true);
    }
  };

  const cancelLogout = () => {
    if (!logoutLoading) {
      setShowLogoutConfirm(false);
    }
  };

  const confirmLogout = async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);

    try {
      await adminLogout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      setLogoutLoading(false);
      setShowLogoutConfirm(false);
      setMobileOpen(false);
      navigate("/");
    }
  };

  /* ================================================================
     AFFICHAGE
     ================================================================ */

  return (
    <div className="novae-admin min-h-screen bg-surface text-ink">
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">
        <SidebarContent
          onRequestLogout={requestLogout}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />
      </aside>

      {/* OVERLAY MOBILE */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* SIDEBAR MOBILE */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-ink shadow-2xl",
          "transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="relative h-full">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <SidebarContent
            onNavigate={() => setMobileOpen(false)}
            onRequestLogout={requestLogout}
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
          />
        </div>
      </aside>

      {/* ZONE PRINCIPALE */}
      <div className="min-h-screen lg:pl-64">
        {/* TOPBAR MOBILE */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-paper/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink transition-colors hover:border-primary/30 hover:text-primary"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="ml-3">
            <div className="font-display text-sm font-bold tracking-[0.16em] text-ink">
              NOVAÉ
            </div>
            <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Administration
            </div>
          </div>
        </header>

        {/* CONTENU DES PAGES */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>

      {/* CONFIRMATION DÉCONNEXION */}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Se déconnecter ?"
        message="Voulez-vous vraiment vous déconnecter de l'administration NOVAÉ ? Vous devrez vous reconnecter pour accéder à votre espace administrateur."
        confirmLabel="Oui, me déconnecter"
        cancelLabel="Annuler"
        loading={logoutLoading}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
}