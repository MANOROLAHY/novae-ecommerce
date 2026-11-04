import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Arrière-plan */}
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onCancel}
        disabled={loading}
        className="absolute inset-0 cursor-default"
      />

      {/* Fenêtre */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                danger
                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              }`}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {danger ? (
                  <>
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                  </>
                ) : (
                  <>
                    <path d="M6 6h15l-2 9H8L6 4H3" />
                    <circle cx="9" cy="19" r="1.5" />
                    <circle cx="18" cy="19" r="1.5" />
                  </>
                )}
              </svg>
            </div>

            <div>
              <h3
                id="confirm-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {title}
              </h3>

              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Confirmation requise
              </p>
            </div>
          </div>

          {/* Bouton fermer */}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="px-6 py-5">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:justify-end">

          {/* Annuler */}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>

          {/* Ajouter / Confirmer */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center rounded-xl border px-6 text-sm font-bold !text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "border-red-600 bg-red-600 hover:border-red-700 hover:bg-red-700"
                : "border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                  />

                  <path
                    d="M21 12a9 9 0 0 1-9 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

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