import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open = false,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  // Bloque le scroll uniquement lorsque la fenêtre est ouverte
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Permet de fermer avec la touche Échap
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  // Très important :
  // lorsque open=false, aucune fenêtre ni aucun overlay n'est présent.
  if (!open) {
    return null;
  }

  const handleCancel = () => {
    if (loading) {
      return;
    }

    onCancel?.();
  };

  const handleConfirm = () => {
    if (loading) {
      return;
    }

    onConfirm?.();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* =========================================================
          ARRIÈRE-PLAN
          ========================================================= */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* =========================================================
          FENÊTRE DE CONFIRMATION
          ========================================================= */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* =======================================================
            HEADER
            ======================================================= */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">

          <div className="flex items-start gap-4">

            {/* Icône */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                danger
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <AlertTriangle
                size={21}
                strokeWidth={2}
              />
            </div>

            {/* Titre */}
            <div>
              <h2
                id="confirm-dialog-title"
                className="text-base font-bold text-slate-950"
              >
                {title}
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Confirmation requise
              </p>
            </div>
          </div>

          {/* =====================================================
              BOUTON X
              ===================================================== */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            aria-label="Fermer"
            className="relative z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={18}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* =======================================================
            CONTENU
            ======================================================= */}
        <div className="px-6 py-6">

          <p className="text-sm leading-6 text-slate-600">
            {message}
          </p>

          {/* Message supplémentaire uniquement pour les actions dangereuses */}
          {danger && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium leading-5 text-red-700">
                Cette action est définitive et ne pourra pas être annulée.
              </p>
            </div>
          )}
        </div>

        {/* =======================================================
            FOOTER / BOUTONS
            ======================================================= */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">

          {/* =====================================================
              ANNULER
              ===================================================== */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="relative z-20 h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          {/* =====================================================
              CONFIRMER
              ===================================================== */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`relative z-20 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Traitement...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
