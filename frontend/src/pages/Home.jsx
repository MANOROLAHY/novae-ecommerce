import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../context/api.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductVisual from "../components/ProductVisual.jsx";

const collections = [
  {
    title: "Mode",
    subtitle: "Des essentiels de caractère",
    image: "coat",
    to: "/boutique?category=Mode",
    number: "01",
  },
  {
    title: "Technologie",
    subtitle: "L'utile, autrement",
    image: "headphones",
    to: "/boutique?category=Électronique",
    number: "02",
  },
  {
    title: "Nouveautés",
    subtitle: "Les dernières découvertes",
    image: "watch",
    to: "/boutique?isNew=true",
    number: "03",
  },
];

function ArrowIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
      <path d="m19 15 1.1 2.9L23 19l-2.9 1.1L19 23l-1.1-2.9L15 19l2.9-1.1L19 15Z" />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, description, to, linkText }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest2 text-accent">
          <span className="h-px w-6 bg-accent" />
          {eyebrow}
        </div>

        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tightest text-ink sm:text-4xl md:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-xl text-sm leading-7 text-gray">
            {description}
          </p>
        )}
      </div>

      {to && (
        <Link
          to={to}
          className="inline-flex w-fit items-center gap-2 text-xs font-bold text-ink transition-colors hover:text-accent"
        >
          {linkText || "Tout découvrir"}
          <ArrowIcon />
        </Link>
      )}
    </div>
  );
}

function ProductSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-surface" />
          <div className="mt-4 h-3 w-1/3 rounded bg-surface" />
          <div className="mt-3 h-4 w-4/5 rounded bg-surface" />
          <div className="mt-3 h-3 w-1/4 rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setLoadError(false);

        const result = await fetchProducts({ featured: "true" });

        if (!Array.isArray(result)) {
          throw new Error("La réponse de l'API n'est pas une liste de produits.");
        }

        if (active) {
          setProducts(result);
        }
      } catch (error) {
        console.error("Erreur de chargement des produits NOVAÉ :", error);

        if (active) {
          setProducts([]);
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const newProducts = useMemo(
    () => products.filter((product) => product.isNew).slice(0, 4),
    [products]
  );

  const promos = useMemo(
    () =>
      products
        .filter((product) => {
          const price = Number(product.price);
          const compareAtPrice = Number(product.compareAtPrice);

          return (
            Number.isFinite(price) &&
            Number.isFinite(compareAtPrice) &&
            compareAtPrice > price &&
            price >= 0
          );
        })
        .slice(0, 4),
    [products]
  );

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  const heroProduct = products.find(
    (product) =>
      typeof product.image === "string" &&
      (product.image.startsWith("/uploads/") ||
        product.image.startsWith("https://") ||
        product.image.startsWith("http://") ||
        product.image.startsWith("data:image/"))
  );

  return (
    <main className="overflow-hidden bg-paper text-ink">
      {/* HERO */}
      <section className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 md:px-8 md:pt-7">
        <div className="relative isolate min-h-[570px] overflow-hidden rounded-[24px] bg-ink text-white sm:rounded-[30px] md:min-h-[680px]">
          <div className="pointer-events-none absolute -right-28 -top-32 h-[460px] w-[460px] rounded-full border border-white/10 sm:h-[620px] sm:w-[620px]" />
          <div className="pointer-events-none absolute -right-10 -top-14 h-[340px] w-[340px] rounded-full border border-white/10 sm:h-[440px] sm:w-[440px]" />

          <div className="pointer-events-none absolute right-[8%] top-[15%] h-64 w-64 rounded-full bg-accent/30 blur-[100px] sm:h-96 sm:w-96" />

          {heroProduct?.image ? (
            <div className="absolute inset-y-0 right-0 hidden w-[58%] md:block">
              <ProductVisual
                image={heroProduct.image}
                className="h-full w-full opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-y-0 right-0 hidden w-[58%] md:block">
              <ProductVisual
                image="bag"
                className="h-full w-full opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/45 to-transparent" />
            </div>
          )}

          <div className="relative z-10 flex min-h-[570px] items-end p-6 sm:p-10 md:min-h-[680px] md:p-14 lg:p-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest2 text-white/75 sm:text-[10px]">
                  NOVAÉ · Collection 2026
                </span>
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-[0.94] tracking-tightest sm:text-6xl md:text-7xl lg:text-[88px]">
                L'essentiel,
                <br />
                <span className="text-blue-400">autrement.</span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
                Mode, accessoires et technologie : découvrez une sélection
                contemporaine pensée pour associer style, qualité et utilité
                au quotidien.
              </p>

              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                <Link
                  to="/boutique"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-950/20 transition-all hover:bg-accentdark"
                >
                  Découvrir la boutique
                  <ArrowIcon />
                </Link>

                <Link
                  to="/boutique?isNew=true"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/25 px-6 py-3 text-xs font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
                >
                  Les nouveautés
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-widest2 text-white/45 sm:gap-6">
                <span>Mode</span>
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                <span>Tech</span>
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                <span>Essentiels</span>
              </div>
            </div>
          </div>

          <div className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-white/15 bg-black/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest2 text-white/65 backdrop-blur-md md:flex">
            <SparkleIcon />
            Une autre vision du quotidien
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-14">
          <div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest2 text-accent">
              <span className="h-px w-7 bg-accent" />
              L'univers NOVAÉ
            </div>

            <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tightest sm:text-5xl md:text-6xl">
              Moins de bruit.
              <br />
              Plus de caractère.
            </h2>
          </div>

          <div className="max-w-xl md:justify-self-end">
            <p className="text-sm leading-8 text-gray md:text-base">
              Chaque pièce a sa place. Nous réunissons des essentiels choisis
              pour leur esthétique, leur fonctionnalité et leur capacité à
              accompagner les usages d'aujourd'hui.
            </p>

            <Link
              to="/boutique"
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-accent transition-colors hover:text-accentdark"
            >
              Explorer notre univers
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="border-y border-line bg-cream">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-20">
          <SectionHeading
            eyebrow="Explorer"
            title="Choisir son univers."
            to="/boutique"
            linkText="Toute la boutique"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.title}
                to={collection.to}
                className="group relative min-h-[330px] overflow-hidden rounded-[22px] border border-line bg-surface sm:min-h-[390px]"
              >
                <ProductVisual
                  image={collection.image}
                  className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />

                <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink/25 text-[10px] font-bold text-white backdrop-blur-sm">
                  {collection.number}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                  <div className="text-[10px] font-bold uppercase tracking-widest2 text-white/60">
                    {collection.subtitle}
                  </div>

                  <h3 className="mt-2 font-display text-3xl font-extrabold">
                    {collection.title}
                  </h3>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-white transition-colors group-hover:text-blue-300">
                    Explorer
                    <ArrowIcon />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NOUVEAUTÉS */}
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-24">
        <SectionHeading
          eyebrow="Fraîchement sélectionnés"
          title="Les nouveautés."
          description="Découvrez les dernières pièces qui rejoignent l'univers NOVAÉ."
          to="/boutique?isNew=true"
          linkText="Toutes les nouveautés"
        />

        {loading ? (
          <ProductSkeletons />
        ) : loadError ? (
          <div className="rounded-2xl border border-line bg-cream px-6 py-10 text-center">
            <p className="text-sm font-semibold text-ink">
              Les produits ne sont pas disponibles pour le moment.
            </p>
            <p className="mt-2 text-sm text-gray">
              Vérifiez que le serveur est démarré, puis actualisez la page.
            </p>
          </div>
        ) : newProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-y border-line py-12 text-center">
            <p className="text-sm text-gray">
              Les prochaines nouveautés arrivent bientôt.
            </p>
          </div>
        )}
      </section>

      {/* PROMOTIONS */}
      {!loading && !loadError && promos.length > 0 && (
        <section className="border-y border-red-100 bg-red-50/70">
          <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-20">
            <SectionHeading
              eyebrow="Offres en cours"
              title="Les pièces du moment."
              description="Une sélection de produits proposés à un prix réduit."
              to="/boutique"
              linkText="Voir la boutique"
            />

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {promos.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SÉLECTION NOVAÉ */}
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-24">
        <SectionHeading
          eyebrow="Sélection NOVAÉ"
          title="Les essentiels."
          description="Des pièces choisies pour leur style, leur usage et leur place dans votre quotidien."
          to="/boutique"
          linkText="Voir tous les produits"
        />

        {loading ? (
          <ProductSkeletons />
        ) : loadError ? (
          <div className="border-y border-line py-10 text-center text-sm text-gray">
            Impossible de charger la sélection pour le moment.
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-y border-line py-12 text-center text-sm text-gray">
            Aucun produit à afficher pour le moment.
          </div>
        )}
      </section>

      {/* MANIFESTE */}
      <section className="border-y border-line bg-cream">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest2 text-accent">
              <SparkleIcon />
              L'esprit NOVAÉ
            </div>

            <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tightest sm:text-5xl md:text-6xl">
              Une identité.
              <br />
              Des pièces choisies.
              <br />
              <span className="text-accent">Une esthétique.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-gray md:text-base">
              La simplicité rencontre le caractère. NOVAÉ rassemble une
              sélection pensée pour accompagner les styles et les usages
              d'aujourd'hui.
            </p>

            <Link
              to="/boutique"
              className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-ink px-7 py-4 text-xs font-bold text-white transition-colors hover:bg-accent"
            >
              Entrer dans la boutique
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 divide-y divide-line px-5 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
          <div className="flex items-center gap-4 py-7 md:px-7 md:py-9 md:first:pl-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-accent">
              <ArrowIcon />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest2 text-ink">
                Livraison offerte
              </div>
              <div className="mt-1 text-xs text-gray">Dès 150 €</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-7 md:px-7 md:py-9">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-accent">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 7v5h-5" />
                <path d="M4.8 9A7.5 7.5 0 0 1 18 6l2 6" />
                <path d="M4 17v-5h5" />
                <path d="M19.2 15A7.5 7.5 0 0 1 6 18l-2-6" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest2 text-ink">
                Retours simples
              </div>
              <div className="mt-1 text-xs text-gray">Sous 30 jours</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-7 md:px-7 md:py-9 md:last:pr-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-accent">
              <SparkleIcon />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest2 text-ink">
                Sélection NOVAÉ
              </div>
              <div className="mt-1 text-xs text-gray">
                Mode · Tech · Essentiels
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}