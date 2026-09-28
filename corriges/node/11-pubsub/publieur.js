// ─────────────────────────────────────────────────────────────
// Atelier 11 — Pub/Sub : le publieur
// Lancer : node ateliers/node/11-pubsub/publieur.js
// (l'abonné doit tourner dans un autre terminal)
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

const CANAL = "notifications";

export async function publier(client, message) {
  // TODO Redis : publier le message sur CANAL et renvoyer la réponse
  //              de Redis (= nombre d'abonnés qui l'ont reçu)
  // --- solution ---
  return client.publish(CANAL, message);
  // --- fin solution ---
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();

const messages = ["Commande #1 validée", "Commande #2 expédiée", "Commande #3 livrée"];
let recus = 0;
for (const m of messages) {
  const n = await publier(client, m);
  console.log(`→ "${m}" reçu par ${n} abonné(s)`);
  recus += n ?? 0;
}

verifier("Les messages ont été reçus par au moins un abonné", recus >= messages.length);
if (recus === 0) console.log("   (L'abonné tourne-t-il ? Sinon les messages sont perdus : Pub/Sub ne stocke rien.)");

await client.quit();
