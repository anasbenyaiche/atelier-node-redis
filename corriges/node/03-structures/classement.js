// ─────────────────────────────────────────────────────────────
// Atelier 3B — Classement de joueurs avec un SORTED SET
// Lancer : node ateliers/node/03-structures/classement.js
//
// Le classement est un sorted set "classement:jeu" :
//   membre = nom du joueur, score = points.
// Complétez uniquement les blocs "TODO Redis".
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

const CLE = "classement:jeu";

export async function ajouterJoueur(client, nom, points) {
  // TODO Redis : ajouter le joueur avec son score dans le sorted set
  // Indice : commande Z… ; en node-redis on passe { score, value }
  // --- solution ---
  await client.zAdd(CLE, { score: points, value: nom });
  // --- fin solution ---
}

export async function ajouterPoints(client, nom, points) {
  // TODO Redis : ajouter des points au score actuel du joueur
  // --- solution ---
  return client.zIncrBy(CLE, points, nom);
  // --- fin solution ---
}

export async function top(client, n) {
  // TODO Redis : renvoyer les n meilleurs joueurs AVEC leur score,
  //              du plus grand au plus petit
  // Indice : ZRANGE … avec l'option REV (méthode …WithScores)
  // --- solution ---
  return client.zRangeWithScores(CLE, 0, n - 1, { REV: true });
  // --- fin solution ---
}

export async function rang(client, nom) {
  // TODO Redis : renvoyer la position du joueur (1 = premier)
  // Indice : Redis compte à partir de 0 et il faut l'ordre décroissant
  // --- solution ---
  const r = await client.zRevRank(CLE, nom);
  return r === null ? null : r + 1;
  // --- fin solution ---
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();
await client.del(CLE);

await ajouterJoueur(client, "alice", 120);
await ajouterJoueur(client, "bob", 90);
await ajouterJoueur(client, "chloe", 150);
await ajouterJoueur(client, "david", 60);
await ajouterPoints(client, "bob", 100); // bob passe à 190

const podium = await top(client, 3);
console.log("Top 3 :", podium);

verifier("4 joueurs dans le classement", (await client.zCard(CLE)) === 4);
verifier("bob a 190 points", (await client.zScore(CLE, "bob")) === 190);
verifier("top(3) renvoie bob en premier", podium?.[0]?.value === "bob" && podium.length === 3);
verifier("chloe est 2e", (await rang(client, "chloe")) === 2);

await client.quit();
