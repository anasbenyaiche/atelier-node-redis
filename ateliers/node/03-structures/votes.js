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
}

export async function voterPour(client, id) {
  // TODO Redis : augmenter le champ "score" de 1 (de façon atomique)
  // Indice : une commande H… qui incrémente un champ
}

export async function voterContre(client, id) {
  // TODO Redis : diminuer le champ "score" de 1
  // Indice : la même commande que ci-dessus suffit
}

export async function lireLien(client, id) {
  // TODO Redis : récupérer TOUS les champs du hash sous forme d'objet
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

const titre = await client.hGet("link:123", "title");
const s123 = await client.hGet("link:123", "score");
const s456 = await client.hGet("link:456", "score");

verifier("enregistrerLien : le hash link:123 contient le titre", titre === "Doc Redis",
  (await client.exists("link:123")) ? "Le hash existe mais le champ title est incorrect." : "Le hash link:123 n'existe pas.");
verifier("voterPour : score du lien 123 = 2", s123 === "2", `Score actuel : ${s123}.`);
verifier("voterContre : score du lien 456 = 0 (1 vote pour, 1 contre)", s456 === "0",
  `Score actuel : ${s456}. ${s456 === "2" ? "voterContre augmente au lieu de diminuer." : ""}`);
verifier("lireLien : renvoie un objet avec tous les champs", lien?.author === "anas" && lien?.url !== undefined,
  lien === undefined ? "La fonction ne renvoie rien (pensez au return)." : "L'objet renvoyé est incomplet.");

await client.quit();
