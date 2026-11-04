import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:4000/api";

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.7-3.5 3-5.2 6.5-5.2s5.8 1.7 6.5 5.2" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common}>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="m5 7 7 5 7-5" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </svg>
    );
  }

  return null;
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest2 font-bold mb-2 text-gray">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-xl border hairline bg-paper px-4 py-3.5 focus-within:border-ink transition-colors">
        <span className="text-gray">
          <Icon name={icon} size={18} />
        </span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm"
          autoComplete={type === "password" ? "current-password" : "email"}
        />
      </div>
    </label>
  );
}

function AuthPanel({ mode, setMode, onAuthenticated }) {
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_URL}/auth/login`
        : `${API_URL}/auth/register`;

      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      localStorage.setItem("novae_token", data.token);
      localStorage.setItem("novae_user", JSON.stringify(data.user));

      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message || "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] min-h-[680px]">
      {/* Partie visuelle */}
      <div className="hidden lg:flex relative overflow-hidden bg-ink text-paper p-12 xl:p-16 flex-col justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest2 text-white/50">
            NOVAÉ / Compte client
          </div>

          <h2 className="font-display font-extrabold text-5xl xl:text-6xl tracking-tightest leading-[0.95] mt-5 max-w-lg">
            Votre espace.
            <br />
            Votre sélection.
          </h2>
        </div>

        <div className="relative">
          <div className="absolute -top-16 -left-10 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -top-8 left-8 w-40 h-40 rounded-full border border-white/10" />

          <p className="relative max-w-sm text-sm leading-relaxed text-white/60">
            Retrouvez vos informations, suivez vos commandes et profitez
            d'une expérience NOVAÉ pensée pour vous.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-cream px-6 py-12 md:px-12 lg:px-16 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <div className="flex gap-6 border-b hairline mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`pb-4 text-[11px] uppercase tracking-widest2 font-bold border-b-2 transition-colors ${
                isLogin
                  ? "border-ink text-ink"
                  : "border-transparent text-gray"
              }`}
            >
              Connexion
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`pb-4 text-[11px] uppercase tracking-widest2 font-bold border-b-2 transition-colors ${
                !isLogin
                  ? "border-ink text-ink"
                  : "border-transparent text-gray"
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold">
              {isLogin ? "Bienvenue" : "Nouveau chez NOVAÉ"}
            </div>

            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tightest mt-2">
              {isLogin ? "Ravi de vous revoir." : "Créer votre compte."}
            </h1>

            <p className="text-gray text-sm leading-relaxed mt-3">
              {isLogin
                ? "Connectez-vous pour accéder à votre espace personnel."
                : "Quelques informations suffisent pour créer votre espace NOVAÉ."}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Field
                label="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                icon="user"
              />
            )}

            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              icon="mail"
            />

            <Field
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              icon="lock"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink text-paper py-4 text-[10px] uppercase tracking-widest2 font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? "Veuillez patienter..."
                : isLogin
                  ? "Se connecter"
                  : "Créer mon compte"}

              {!loading && <Icon name="arrow" size={17} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/boutique"
              className="text-[10px] uppercase tracking-widest2 font-bold text-gray hover:text-ink transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const token = localStorage.getItem("novae_token");

      if (!token) {
        setLoadingOrders(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Impossible de récupérer vos commandes"
          );
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error("Erreur historique commandes :", error);
        setOrdersError(
          error.message || "Impossible de récupérer vos commandes"
        );
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, []);

  async function logout() {
    setLoggingOut(true);

    const token = localStorage.getItem("novae_token");

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
    } catch {
      // Même si le serveur ne répond pas,
      // on supprime la session locale.
    }

    localStorage.removeItem("novae_token");
    localStorage.removeItem("novae_user");

    setShowLogoutModal(false);
    onLogout();
    navigate("/compte");
  }

  function formatDate(date) {
    if (!date) return "Date inconnue";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function getStatusLabel(status) {
    if (status === "confirmée") return "Confirmée";
    if (status === "en préparation") return "En préparation";
    if (status === "expédiée") return "Expédiée";
    if (status === "livrée") return "Livrée";
    if (status === "annulée") return "Annulée";

    return status || "En attente";
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-5 md:px-8 py-14 md:py-20">
        <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold">
          NOVAÉ / Espace client
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-3 mb-12">
          <div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tightest">
              Bonjour {user.name}.
            </h1>

            <p className="text-gray mt-4">
              Bienvenue dans votre espace personnel NOVAÉ.
            </p>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 self-start md:self-auto rounded-full border hairline px-5 py-3 text-[10px] uppercase tracking-widest2 font-bold hover:bg-ink hover:text-paper transition-colors"
          >
            <Icon name="logout" size={16} />
            Déconnexion
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* PROFIL */}
          <div className="rounded-2xl border hairline bg-cream p-7 md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
              Mon profil
            </div>

            <div className="mt-7 grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest2 text-gray">
                  Nom
                </div>

                <div className="mt-2 font-semibold">
                  {user.name}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest2 text-gray">
                  Email
                </div>

                <div className="mt-2 font-semibold break-all">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* BOUTIQUE */}
          <Link
            to="/boutique"
            className="rounded-2xl bg-ink text-paper p-7 flex flex-col justify-between min-h-[190px] hover:opacity-90 transition-opacity"
          >
            <div className="text-[10px] uppercase tracking-widest2 text-white/50 font-bold">
              Boutique
            </div>

            <div>
              <div className="font-display font-extrabold text-2xl">
                Découvrir la collection
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest2 font-bold">
                Explorer
                <Icon name="arrow" size={15} />
              </div>
            </div>
          </Link>

          {/* COMMANDES */}
          <div className="rounded-2xl border hairline bg-paper p-7 md:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                  Mon espace
                </div>

                <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tightest mt-2">
                  Mes commandes
                </h2>
              </div>

              {orders.length > 0 && (
                <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
                  {orders.length}{" "}
                  {orders.length === 1 ? "commande" : "commandes"}
                </div>
              )}
            </div>

            {/* CHARGEMENT */}
            {loadingOrders && (
              <div className="mt-8 border-t hairline py-14 text-center">
                <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-widest2 text-gray font-bold">
                  <span className="w-4 h-4 rounded-full border-2 border-gray/30 border-t-ink animate-spin" />
                  Chargement de vos commandes...
                </div>
              </div>
            )}

            {/* ERREUR */}
            {!loadingOrders && ordersError && (
              <div className="mt-8 border-t hairline pt-8">
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {ordersError}
                </div>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-full bg-ink text-paper px-5 py-3 text-[10px] uppercase tracking-widest2 font-bold"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* AUCUNE COMMANDE */}
            {!loadingOrders && !ordersError && orders.length === 0 && (
              <div className="mt-8 py-14 text-center border-t hairline">
                <div className="w-14 h-14 rounded-full bg-cream mx-auto flex items-center justify-center">
                  <span className="text-xl">◇</span>
                </div>

                <p className="font-display font-bold text-xl mt-5">
                  Aucune commande pour le moment.
                </p>

                <p className="text-gray text-sm mt-2">
                  Découvrez notre collection et passez votre première
                  commande.
                </p>

                <Link
                  to="/boutique"
                  className="inline-flex mt-6 rounded-full bg-ink text-paper px-6 py-3.5 text-[10px] uppercase tracking-widest2 font-bold"
                >
                  Découvrir la boutique
                </Link>
              </div>
            )}

            {/* LISTE DES COMMANDES */}
            {!loadingOrders && !ordersError && orders.length > 0 && (
              <div className="mt-8 border-t hairline divide-y hairline">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-display font-extrabold text-lg">
                          {order.reference}
                        </span>

                        <span className="rounded-full bg-cream px-3 py-1 text-[9px] uppercase tracking-widest2 font-bold">
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray">
                        <span>
                          {formatDate(order.createdAt)}
                        </span>

                        <span>
                          {order.items?.length || 0}{" "}
                          {order.items?.length === 1
                            ? "article"
                            : "articles"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6">
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-widest2 text-gray font-bold">
                          Total
                        </div>

                        <div className="font-display font-extrabold text-lg mt-1">
                          {formatPrice(order.total)} Ar
                        </div>
                      </div>

                      <Link
                        to={`/confirmation/${order.id}`}
                        className="inline-flex items-center gap-2 rounded-full border hairline px-5 py-3 text-[10px] uppercase tracking-widest2 font-bold hover:bg-ink hover:text-paper transition-colors"
                      >
                        Voir
                        <Icon name="arrow" size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => {
              if (!loggingOut) {
                setShowLogoutModal(false);
              }
            }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm cursor-default"
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-paper border hairline shadow-2xl p-7 md:p-9">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-6">
              <Icon name="logout" size={21} />
            </div>

            <div className="text-[10px] uppercase tracking-widest2 text-accent font-bold">
              NOVAÉ / Déconnexion
            </div>

            <h2
              id="logout-title"
              className="font-display font-extrabold text-2xl md:text-3xl tracking-tightest mt-2"
            >
              Voulez-vous vous déconnecter ?
            </h2>

            <p className="text-gray text-sm leading-relaxed mt-4">
              Votre session sera fermée sur cet appareil. Vous pourrez vous
              reconnecter à tout moment avec votre adresse email.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-full border hairline px-5 py-3.5 text-[10px] uppercase tracking-widest2 font-bold hover:bg-cream transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={logout}
                className="flex-1 rounded-full bg-ink text-paper px-5 py-3.5 text-[10px] uppercase tracking-widest2 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Account() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("novae_token");

    if (!token) {
      setCheckingSession(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session invalide");
        }

        return response.json();
      })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem(
          "novae_user",
          JSON.stringify(data.user)
        );
      })
      .catch(() => {
        localStorage.removeItem("novae_token");
        localStorage.removeItem("novae_user");
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest2 text-gray font-bold">
          Chargement de votre espace...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <AccountDashboard
        user={user}
        onLogout={() => setUser(null)}
      />
    );
  }

  return (
    <AuthPanel
      mode={mode}
      setMode={setMode}
      onAuthenticated={(authenticatedUser) => {
        setUser(authenticatedUser);
      }}
    />
  );
iiiiii}
