// Connexion partagée par tous les ateliers — rien à compléter ici.
import { createClient } from "redis";

export async function connecter(url = process.env.REDIS_URL || "redis://localhost:6379") {
  const client = createClient({ url });
  client.on("error", (err) => console.error("Erreur Redis :", err.message));
  await client.connect();
  return client;
}

// Petit utilitaire d'auto-vérification : affiche ✅ ou ❌
export function verifier(libelle, condition) {
  console.log(`${condition ? "✅" : "❌"} ${libelle}`);
  return condition;
}
