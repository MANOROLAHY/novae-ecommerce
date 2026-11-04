const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error(
    "ERREUR : la variable ADMIN_PASSWORD doit être définie dans le fichier .env"
  );
}

export const ADMIN_PASSWORD = adminPassword;
