// Connexion partagée par tous les ateliers — rien à compléter ici.
import { createClient } from "redis";

export async function connecter(url = process.env.REDIS_URL || "redis://localhost:6379") {
  const client = createClient({
    url,
    socket: {
      connectTimeout: 3000,
      // 3 tentatives maximum, puis on abandonne avec un message clair
      reconnectStrategy: (essais) => (essais >= 3 ? new Error("Redis injoignable") : 500),
    },
  });
  client.on("error", () => {}); // les erreurs sont gérées ci-dessous

  try {
    await client.connect();
  } catch (err) {
    console.error(`❌ Impossible de se connecter à Redis sur ${url}`);
    console.error("   → Le lab est-il démarré ?  docker compose up -d");
    console.error("   → Vérifiez avec :          docker ps   (le conteneur redis-lab doit être Up)");
    process.exit(1);
  }
  return client;
}

// Petit utilitaire d'auto-vérification : affiche ✅ ou ❌,
// et un indice 💡 facultatif en cas d'échec
export function verifier(libelle, condition, indice) {
  console.log(`${condition ? "✅" : "❌"} ${libelle}`);
  if (!condition && indice) console.log(`   💡 ${indice}`);
  return condition;
}
