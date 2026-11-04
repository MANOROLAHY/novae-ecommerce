import React from "react";

// Silhouettes vectorielles des produits historiques.
// Elles restent utilisées lorsque product.image contient
// un identifiant comme "coat", "bag", "watch", etc.
const ICONS = {
  coat: (
    <path d="M70 40 L100 20 L130 40 L130 60 L115 55 L118 190 L82 190 L85 55 L70 60 Z M100 20 L100 55" />
  ),
  bag: (
    <path d="M55 90 L145 90 L138 190 L62 190 Z M75 90 C75 60 85 45 100 45 C115 45 125 60 125 90" />
  ),
  shirt: (
    <path d="M70 45 L100 60 L130 45 L150 70 L130 90 L124 85 L124 190 L76 190 L76 85 L70 90 L50 70 Z" />
  ),
  shoes: (
    <path d="M45 150 C45 140 55 135 70 133 L75 100 L110 100 L112 133 C130 135 155 140 155 155 C155 165 140 168 100 168 C70 168 45 163 45 150 Z" />
  ),
  headphones: (
    <path d="M50 130 L50 105 C50 65 72 40 100 40 C128 40 150 65 150 105 L150 130 M45 125 L45 165 C45 172 51 178 58 178 L62 178 C69 178 75 172 75 165 L75 138 C75 131 69 125 62 125 Z M125 125 L138 125 C145 125 151 131 151 138 L151 165 C151 172 145 178 138 178 L134 178 C127 178 121 172 121 165 L121 138 C121 131 127 125 134 125 Z" />
  ),
  watch: (
    <path d="M100 60 L100 40 M100 160 L100 180 M80 40 L120 40 M80 180 L120 180 M70 100 A30 30 0 1 1 130 100 A30 30 0 1 1 70 100 Z M100 85 L100 100 L112 108" />
  ),
  speaker: (
    <path d="M60 40 L140 40 L140 190 L60 190 Z M100 65 A15 15 0 1 1 100 65.01 M100 130 A28 28 0 1 1 100 130.01 M100 130 A14 14 0 1 1 100 130.01" />
  ),
  laptop: (
    <path d="M55 60 L145 60 L145 145 L55 145 Z M40 160 L160 160 L150 145 L50 145 Z M65 75 L135 75 L135 130 L65 130 Z" />
  ),
  trousers: (
    <path d="M65 40 L135 40 L140 190 L110 190 L100 100 L90 190 L60 190 Z" />
  ),
  scarf: (
    <path d="M40 90 C70 70 130 70 160 90 C150 100 140 95 130 100 C150 115 155 140 145 160 C135 145 125 130 110 125 C120 145 115 165 100 175 C95 155 90 135 75 125 C65 140 60 155 65 175 C50 160 45 135 55 115 C45 110 42 100 40 90 Z" />
  ),
  camera: (
    <path d="M50 80 L80 80 L88 65 L112 65 L120 80 L150 80 L150 155 L50 155 Z M100 118 A28 28 0 1 1 100 118.01 M100 100 A2 2 0 1 1 100 100.01" />
  ),
  belt: (
    <path d="M40 100 L160 100 L160 120 L40 120 Z M90 90 L110 90 L110 130 L90 130 Z M100 95 L100 125" />
  ),
};

const FALLBACK = ICONS.bag;

function isRealImage(image) {
  if (!image || typeof image !== "string") {
    return false;
  }

  return (
    image.startsWith("/uploads/") ||
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:image/")
  );
}

export default function ProductVisual({ image, className = "" }) {
  // ---------------------------------------------------------------------------
  // Vraie photo
  // ---------------------------------------------------------------------------
  if (isRealImage(image)) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <img
          src={image}
          alt="Photo du produit"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(10,10,10,0.06) 100%)",
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Anciennes silhouettes SVG
  // ---------------------------------------------------------------------------
  const path = ICONS[image] || FALLBACK;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fond studio */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FAFAF9 0%, #EFEFEB 100%)",
        }}
      />

      {/* Ombre portée au sol */}
      <div
        className="absolute left-1/2 bottom-[8%] w-[55%] h-[7%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(10,10,10,0.18) 0%, transparent 72%)",
        }}
      />

      <svg
        viewBox="0 0 200 220"
        className="relative w-full h-full"
        style={{
          padding: "14%",
          filter:
            "drop-shadow(0 8px 10px rgba(10,10,10,0.10))",
        }}
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {path}
      </svg>
    </div>
  );
}
