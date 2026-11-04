import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { adminLogin } from "../context/api.js";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await adminLogin(password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err?.message || "Connexion impossible. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b0a_1px,transparent_1px),linear-gradient(to_bottom,#64748b0a_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Retour à la boutique
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="bg-slate-950 px-7 py-8 text-white sm:px-9">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/30">
                <span className="font-display text-2xl font-extrabold">N</span>
              </div>

              <div>
                <p className="font-display text-xl font-extrabold tracking-[0.22em]">
                  NOVAÉ
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Espace administration
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                Espace sécurisé
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Bon retour.
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Connectez-vous pour gérer votre boutique et suivre votre activité.
              </p>
            </div>
          </div>

          <div className="px-7 py-8 sm:px-9">
            {sessionExpired && (
              <div
                role="alert"
                className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Session expirée</p>
                  <p className="mt-1 leading-5">
                    Votre session n’est plus valide. Reconnectez-vous pour continuer.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <p className="leading-5">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Mot de passe administrateur
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    placeholder="Saisissez votre mot de passe"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-700/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} aria-hidden="true" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-xs leading-5 text-slate-500">
                L’accès à cet espace est réservé à l’administration de NOVAÉ.
                Ne partagez jamais vos identifiants.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} NOVAÉ. Tous droits réservés.
        </p>
      </div>
    </main>
  );
}