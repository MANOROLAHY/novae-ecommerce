import React from "react";
import {
  User,
  ShieldCheck,
  LogOut,
  Store,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

import AdminLayout from "./AdminLayout.jsx";
import { adminLogout } from "../context/api.js";

export default function AdminProfile() {
  const adminToken = localStorage.getItem("adminToken");

  async function handleLogout() {
    try {
      await adminLogout();
    } catch (error) {
      console.error(error);
      localStorage.removeItem("adminToken");
    }

    window.location.href = "/admin/connexion";
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1400px] space-y-8 px-5 py-6 sm:px-7 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
            <span>NOVAÉ</span>
            <span className="text-slate-300">/</span>
            <span>Administration</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Profil administrateur
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez votre session et les informations de votre espace
            d'administration.
          </p>
        </div>

        {/* Profile card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-900 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-950 shadow-lg">
                N
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    Administrateur NOVAÉ
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Session active
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  Gestion complète de la boutique et du catalogue.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8">
            {/* Account */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <User size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Compte administrateur
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Accès principal
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nom
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Administrateur NOVAÉ
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Rôle
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Administrateur
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Boutique
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    NOVAÉ
                  </p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Sécurité
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    État de votre connexion
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <LockKeyhole size={17} className="text-slate-400" />

                    <span className="text-sm font-medium text-slate-700">
                      Authentification
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={14} />
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={17} className="text-slate-400" />

                    <span className="text-sm font-medium text-slate-700">
                      Session sécurisée
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={14} />
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session */}
          <div className="border-t border-slate-200 px-6 py-6 md:px-8">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Store size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-950">
                    Session administrateur
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Vous êtes actuellement connecté à l'espace
                    d'administration de NOVAÉ. Vous pouvez gérer les produits,
                    les commandes et consulter les ventes.
                  </p>

                  <p className="mt-3 truncate text-[11px] text-blue-500">
                    Session :{" "}
                    {adminToken
                      ? `${adminToken.substring(0, 8)}••••••••`
                      : "Session locale"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Terminer la session
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Déconnectez-vous lorsque vous avez terminé votre gestion.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              Se déconnecter
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
