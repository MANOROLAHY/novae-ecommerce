// Associe (approximativement) un nom de coloris en français à une couleur
// d'affichage, pour les petites pastilles de couleur sur les cartes produit.
const MAP = {
  camel: "#C19A6B",
  "noir profond": "#0A0A0A",
  noir: "#111113",
  cognac: "#8B4A2B",
  ivoire: "#F3EEE3",
  "vert olive": "#6B6E3A",
  "marron patiné": "#6B4226",
  marron: "#6B4226",
  titane: "#B7B9BC",
  "titane naturel": "#B7B9BC",
  "noir sablé": "#3A3A3C",
  "noir mat": "#1C1C1E",
  "chêne clair": "#C89B6A",
  "chêne fumé": "#5A4632",
  "gris sidéral": "#5C5E62",
  argent: "#D6D8DA",
  "gris anthracite": "#3B3D40",
  marine: "#1B2A4A",
  "beige naturel": "#D8C7A8",
  bordeaux: "#5A1B24",
  "argent vintage": "#C7C4B8",
  "noir/marron": "#4A362B",
};

export function colorToHex(name) {
  if (!name) return "#CCCCCC";
  return MAP[name.toLowerCase()] || "#CCCCCC";
}
