// ─────────────────────────────────────────────────────────────
// Atelier 3A — Système de votes avec un HASH
// Lancer : node ateliers/node/03-structures/votes.js
//
// Chaque lien est stocké dans un hash "link:<id>" avec les champs
// author, title, url et score.
// Complétez uniquement les blocs "TODO Redis".
// Rappel : en node-redis, une commande Redis s'écrit en camelCase
//          (ex. la commande XYZADD devient client.xyzAdd(...)).
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

export async function enregistrerLien(client, id, author, title, url) {
  // TODO Redis : créer le hash "link:<id>" avec les 4 champs (score = 0)
  // Indice : une seule commande H… accepte plusieurs champs d'un coup
  // --- solution ---
  await client.hSet(`link:${id}`, { author, title, url, score: 0 });
  // --- fin solution ---
}

export async function voterPour(client, id) {
  // TODO Redis : augmenter le champ "score" de 1 (de façon atomique)
  // Indice : une commande H… qui incrémente un champ
  // --- solution ---
  return client.hIncrBy(`link:${id}`, "score", 1);
  // --- fin solution ---
}

export async function voterContre(client, id) {
  // TODO Redis : diminuer le champ "score" de 1
  // Indice : la même commande que ci-dessus suffit
  // --- solution ---
  return client.hIncrBy(`link:${id}`, "score", -1);
  // --- fin solution ---
}

export async function lireLien(client, id) {
  // TODO Redis : récupérer TOUS les champs du hash sous forme d'objet
  // --- solution ---
  return client.hGetAll(`link:${id}`);
  // --- fin solution ---
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();
await client.del(["link:123", "link:456"]);

await enregistrerLien(client, 123, "anas", "Doc Redis", "https://redis.io/docs");
await voterPour(client, 123);
await voterPour(client, 123);
await enregistrerLien(client, 456, "hugo", "Blog Redis", "https://redis.io/blog");
await voterPour(client, 456);
await voterContre(client, 456);

const lien = await lireLien(client, 123);
console.log("Lien 123 :", lien);

verifier("Le hash link:123 contient le titre", (await client.hGet("link:123", "title")) === "Doc Redis");
verifier("Score du lien 123 = 2", (await client.hGet("link:123", "score")) === "2");
verifier("Score du lien 456 = 0", (await client.hGet("link:456", "score")) === "0");
verifier("lireLien() renvoie un objet complet", lien?.author === "anas" && lien?.url !== undefined);

await client.quit();
