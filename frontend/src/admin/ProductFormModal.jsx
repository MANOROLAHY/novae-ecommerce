import React, { useEffect, useRef, useState } from "react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "../context/api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const emptyForm = {
  ref: "",
  name: "",
  category: "",
  subcategory: "",
  price: "",
  compareAtPrice: "",
  currency: "EUR",
  description: "",
  details: "",
  colors: "",
  sizes: "",
  stock: "",
  image: "bag",
  featured: false,
  isNew: false,
  rating: "",
  reviewCount: "",
};

function productToForm(product) {
  return {
    ref: product?.ref || "",
    name: product?.name || "",
    category: product?.category || "",
    subcategory: product?.subcategory || "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    currency: product?.currency || "EUR",
    description: product?.description || "",
    details: (product?.details || []).join("\n"),
    colors: (product?.colors || []).join(", "),
    sizes: (product?.sizes || []).join(", "),
    stock: product?.stock ?? "",
    image: product?.image || "bag",
    featured: Boolean(product?.featured),
    isNew: Boolean(product?.isNew),
    rating: product?.rating ?? "",
    reviewCount: product?.reviewCount ?? "",
  };
}

function formToPayload(form) {
  return {
    ref: form.ref.trim() || undefined,
    name: form.name.trim(),
    category: form.category.trim(),
    subcategory: form.subcategory.trim(),
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice
      ? Number(form.compareAtPrice)
      : null,
    currency: form.currency,
    description: form.description.trim(),
    details: form.details
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    colors: form.colors
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    sizes: form.sizes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    stock: Number(form.stock) || 0,
    image: form.image,
    featured: Boolean(form.featured),
    isNew: Boolean(form.isNew),
    rating: form.rating ? Number(form.rating) : null,
    reviewCount: form.reviewCount
      ? Number(form.reviewCount)
      : 0,
  };
}

export default function ProductFormModal({
  product,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(product);

  const [form, setForm] = useState(
    isEdit ? productToForm(product) : emptyForm
  );

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState(
    product?.image?.startsWith("/uploads/")
      ? product.image
      : ""
  );

  const fileInputRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const set = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setImageError(
        "Format non autorisé. Utilisez JPG, PNG ou WEBP."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError(
        "Image trop grande. La taille maximale est de 5 Mo."
      );

      event.target.value = "";
      return;
    }

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const removeSelectedImage = () => {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);

    setImagePreview(
      product?.image?.startsWith("/uploads/")
        ? product.image
        : ""
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setImageError("");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.subcategory.trim() ||
      !form.price
    ) {
      setError(
        "Merci de remplir le nom, la catégorie, la sous-catégorie et le prix."
      );
      return;
    }

    if (Number(form.price) < 0) {
      setError("Le prix ne peut pas être négatif.");
      return;
    }

    setError("");
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError("");

    try {
      const payload = formToPayload(form);

      const savedProduct = isEdit
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      let finalProduct = savedProduct;

      if (selectedImage) {
        setUploadingImage(true);

        const imageResult = await uploadProductImage(
          savedProduct.id,
          selectedImage
        );

        finalProduct =
          imageResult?.product || savedProduct;
      }

      setShowConfirm(false);

      onSaved(finalProduct);
    } catch (err) {
      console.error(err);

      setShowConfirm(false);

      setError(
        err?.message ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
        className="absolute inset-0 cursor-default"
      />

      <div
        className="
          relative
          z-10
          flex
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-paper
          shadow-2xl
          h-[calc(100dvh-1rem)]
          sm:h-[calc(100dvh-2rem)]
        "
      >
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b hairline px-5 py-4 sm:px-7">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest2 text-accent">
              NOVAÉ / Catalogue
            </div>

            <h2
              id="product-modal-title"
              className="mt-1 font-display text-xl font-extrabold tracking-tight"
            >
              {isEdit
                ? "Modifier le produit"
                : "Ajouter un produit"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              text-gray
              transition
              hover:bg-slate-100
              hover:text-ink
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* ZONE QUI DÉFILE */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              px-5
              py-5
              sm:px-7
              sm:py-7
            "
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
              {/* COLONNE PRINCIPALE */}

              <div className="space-y-6">
                <SectionTitle
                  number="01"
                  title="Informations"
                  description="Informations principales du produit."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Référence"
                    value={form.ref}
                    onChange={set("ref")}
                    placeholder="Ex. NOV-001"
                  />

                  <Field
                    label="Nom du produit *"
                    value={form.name}
                    onChange={set("name")}
                    required
                    placeholder="Nom du produit"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Catégorie *"
                    value={form.category}
                    onChange={set("category")}
                    required
                    placeholder="Mode"
                  />

                  <Field
                    label="Sous-catégorie *"
                    value={form.subcategory}
                    onChange={set("subcategory")}
                    required
                    placeholder="Manteaux"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Prix *"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    required
                    placeholder="0.00"
                  />

                  <Field
                    label="Prix barré"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={set("compareAtPrice")}
                    placeholder="Optionnel"
                  />

                  <Field
                    label="Stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={set("stock")}
                    placeholder="0"
                  />
                </div>

                <Field
                  label="Devise"
                  value={form.currency}
                  onChange={set("currency")}
                  placeholder="EUR"
                />

                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={set("description")}
                  rows={5}
                  placeholder="Présentez le produit..."
                />

                <TextArea
                  label="Détails & composition"
                  value={form.details}
                  onChange={set("details")}
                  rows={5}
                  placeholder={
                    "100% laine mérinos\nFabriqué en France\nNettoyage à sec"
                  }
                  hint="Une ligne par information."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Coloris"
                    value={form.colors}
                    onChange={set("colors")}
                    placeholder="Noir, Blanc, Camel"
                  />

                  <Field
                    label="Tailles"
                    value={form.sizes}
                    onChange={set("sizes")}
                    placeholder="S, M, L, XL"
                  />
                </div>

                <SectionTitle
                  number="02"
                  title="Évaluation"
                  description="Note et nombre d'avis clients."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Note"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={set("rating")}
                    placeholder="0 à 5"
                  />

                  <Field
                    label="Nombre d'avis"
                    type="number"
                    min="0"
                    value={form.reviewCount}
                    onChange={set("reviewCount")}
                    placeholder="0"
                  />
                </div>

                <SectionTitle
                  number="03"
                  title="Visibilité"
                  description="Contrôlez la présence du produit sur la boutique."
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleCard
                    checked={form.featured}
                    onChange={set("featured")}
                    title="Produit mis en avant"
                    description="Afficher dans les sélections."
                    icon="star"
                  />

                  <ToggleCard
                    checked={form.isNew}
                    onChange={set("isNew")}
                    title="Nouveauté"
                    description="Afficher comme nouveau produit."
                    icon="sparkles"
                  />
                </div>
              </div>

              {/* COLONNE IMAGE */}

              <div className="space-y-6">
                <SectionTitle
                  number="04"
                  title="Image"
                  description="Ajoutez une photo réelle du produit."
                />

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt={
                          form.name ||
                          "Aperçu du produit"
                        }
                        className="h-72 w-full object-cover sm:h-80"
                      />

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                              Aperçu
                            </div>

                            <div className="mt-1 truncate text-sm font-semibold text-white">
                              {selectedImage
                                ? selectedImage.name
                                : "Photo actuelle"}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={openFilePicker}
                              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-slate-100"
                            >
                              Remplacer
                            </button>

                            {selectedImage && (
                              <button
                                type="button"
                                onClick={
                                  removeSelectedImage
                                }
                                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-sale transition hover:bg-red-50"
                              >
                                Retirer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="
                        flex
                        h-80
                        w-full
                        flex-col
                        items-center
                        justify-center
                        gap-4
                        px-6
                        text-center
                        transition
                        hover:bg-white
                      "
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                          />
                          <circle
                            cx="8.5"
                            cy="8.5"
                            r="1.5"
                          />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>

                      <div>
                        <div className="text-sm font-bold">
                          Ajouter une photo
                        </div>

                        <div className="mt-1 text-xs text-gray">
                          JPG, PNG ou WEBP
                        </div>

                        <div className="mt-1 text-xs text-gray">
                          5 Mo maximum
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imageError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-sale">
                    {imageError}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    Conseil
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray">
                    Utilisez une image nette avec un arrière-plan
                    propre pour obtenir un rendu professionnel dans
                    la boutique NOVAÉ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ERREUR */}

          {error && (
            <div className="shrink-0 border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-sale sm:px-7">
              {error}
            </div>
          )}

          {/* FOOTER */}

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t hairline bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-xl
                border
                border-slate-200
                px-5
                py-3
                text-sm
                font-semibold
                text-gray
                transition
                hover:bg-slate-50
                hover:text-ink
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                rounded-xl
                bg-ink
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-accent
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving
                ? uploadingImage
                  ? "Envoi de la photo..."
                  : "Enregistrement..."
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRMATION */}

      <ConfirmDialog
        open={showConfirm}
        title={
          isEdit
            ? "Enregistrer les modifications ?"
            : "Ajouter ce produit ?"
        }
        message={
          isEdit
            ? `Les modifications de « ${form.name} » seront enregistrées.`
            : `« ${form.name} » sera ajouté au catalogue.`
        }
        confirmLabel={
          isEdit ? "Enregistrer" : "Ajouter"
        }
        loading={saving}
        onConfirm={confirmSave}
        onCancel={() => {
          if (!saving) {
            setShowConfirm(false);
          }
        }}
      />
    </div>
  );
}

function SectionTitle({
  number,
  title,
  description,
}) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-widest text-accent">
          {number}
        </span>

        <h3 className="text-sm font-extrabold tracking-tight">
          {title}
        </h3>
      </div>

      <p className="mt-1 pl-7 text-xs text-gray">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  step,
  min,
  max,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-3.5
          py-3
          text-sm
          text-ink
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-accent
          focus:bg-white
          focus:ring-2
          focus:ring-accent/10
        "
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  hint = "",
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray">
          {label}
        </span>

        {hint && (
          <span className="text-[10px] text-slate-400">
            {hint}
          </span>
        )}
      </div>

      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="
          w-full
          resize-y
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-3.5
          py-3
          text-sm
          leading-relaxed
          text-ink
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-accent
          focus:bg-white
          focus:ring-2
          focus:ring-accent/10
        "
      />
    </label>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
  icon,
}) {
  return (
    <label
      className={`
        flex
        cursor-pointer
        items-center
        gap-3
        rounded-xl
        border
        p-4
        transition
        ${
          checked
            ? "border-accent bg-accent/5"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            checked
              ? "bg-accent text-white"
              : "bg-slate-100 text-gray"
          }
        `}
      >
        {icon === "star" ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.45 1.08 6.3L12 17.2l-5.63 2.95 1.08-6.3L2.9 9.4l6.3-.9L12 2.8z" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">
          {title}
        </div>

        <div className="mt-0.5 text-[11px] text-gray">
          {description}
        </div>
      </div>

      <div
        className={`
          h-6
          w-10
          shrink-0
          rounded-full
          p-1
          transition-colors
          ${
            checked
              ? "bg-accent"
              : "bg-slate-200"
          }
        `}
      >
        <div
          className={`
            h-4
            w-4
            rounded-full
            bg-white
            shadow-sm
            transition-transform
            ${
              checked
                ? "translate-x-4"
                : "translate-x-0"
            }
          `}
        />
      </div>
    </label>
  );
}
