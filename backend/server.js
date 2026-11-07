import app from "./app.js";
import { seedIfEmpty } from "./db/seed.js";

const PORT = process.env.PORT || 4000;

// Initialiser les données si la base est vide
seedIfEmpty();

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Luxe API démarrée sur http://localhost:${PORT}`);
});
