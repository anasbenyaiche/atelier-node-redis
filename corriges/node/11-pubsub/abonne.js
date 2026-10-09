// ─────────────────────────────────────────────────────────────
// Atelier 11 — Pub/Sub : l'abonné
// Lancer dans un 1er terminal : node ateliers/node/11-pubsub/abonne.js
// Puis dans un 2e terminal    : node ateliers/node/11-pubsub/publieur.js
// (ou depuis redis-cli : PUBLISH notifications "bonjour")
// Arrêter avec Ctrl+C.
// ─────────────────────────────────────────────────────────────
import { connecter } from "../lib/client.js";

const CANAL = "notifications";

// Une connexion abonnée ne peut plus rien faire d'autre :
// on utilise une connexion dédiée.
const abonne = await connecter();

function recevoir(message, canal) {
  console.log(`📩 [${canal}] ${message}`);
}

// TODO Redis : s'abonner au canal CANAL en utilisant la fonction recevoir
// Indice : client.subscribe(canal, fonctionDeRappel)
// --- solution ---
await abonne.subscribe(CANAL, recevoir);
// --- fin solution ---

console.log(`👂 En écoute sur "${CANAL}"…`);

process.on("SIGINT", async () => {
  await abonne.quit();
  process.exit(0);
});
