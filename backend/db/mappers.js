// La base stocke certains champs en snake_case et en JSON texte (details,
// colors, sizes). Cette fonction les transforme vers le format que le
// frontend attend (camelCase, tableaux, booléens JS).
export function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    currency: row.currency,
    description: row.description,
    details: JSON.parse(row.details || "[]"),
    colors: JSON.parse(row.colors || "[]"),
    sizes: JSON.parse(row.sizes || "[]"),
    stock: row.stock,
    image: row.image,
    featured: !!row.featured,
    isNew: !!row.is_new,
    rating: row.rating,
    reviewCount: row.review_count,
    compareAtPrice: row.compare_at_price,
  };
}
