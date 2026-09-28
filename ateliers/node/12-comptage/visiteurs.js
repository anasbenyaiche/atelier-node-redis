// ─────────────────────────────────────────────────────────────
// Atelier 12 — Compter des visiteurs : HyperLogLog et Bitmap
// Lancer : node ateliers/node/12-comptage/visiteurs.js
//
// Partie A (HyperLogLog) : compter les visiteurs UNIQUES d'un site,
//   avec une mémoire fixe (~12 Ko) quel que soit le nombre de visiteurs.
// Partie B (Bitmap) : savoir si l'utilisateur n°X est venu tel jour,
//   1 bit par utilisateur.
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

// ── Partie A : HyperLogLog ──────────────────────────────────
export async function ajouterVisite(client, jour, visiteur) {
  // TODO Redis : ajouter le visiteur au HyperLogLog "hll:<jour>"
  // Indice : les commandes HyperLogLog commencent par PF…
}

export async function compterUniques(client, jour) {
  // TODO Redis : renvoyer le nombre (estimé) de visiteurs uniques
}

export async function fusionnerSemaine(client, jours) {
  // TODO Redis : fusionner les HyperLogLog des jours dans "hll:semaine"
}

// ── Partie B : Bitmap ───────────────────────────────────────
export async function marquerPresent(client, jour, userId) {
  // TODO Redis : mettre à 1 le bit n° userId de la clé "presence:<jour>"
}

export async function estVenu(client, jour, userId) {
  // TODO Redis : lire le bit n° userId (renvoie 0 ou 1)
}

export async function compterPresents(client, jour) {
  // TODO Redis : compter le nombre de bits à 1
}

export async function presentsLesDeuxJours(client, jour1, jour2) {
  // TODO Redis : calculer un ET logique entre les deux bitmaps,
  //              stocker le résultat dans "presence:les2", puis compter ses bits
  // Indice : BITOP AND destination source1 source2
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();
await client.del(["hll:lundi", "hll:mardi", "hll:semaine", "set:lundi", "presence:lundi", "presence:mardi", "presence:les2"]);

// A — 5 000 visites de 1 000 visiteurs différents
for (let i = 0; i < 5000; i++) {
  const v = `user_${i % 1000}`;
  await ajouterVisite(client, "lundi", v);
  await client.sAdd("set:lundi", v); // même chose dans un Set, pour comparer
}
for (let i = 500; i < 1500; i++) await ajouterVisite(client, "mardi", `user_${i}`);
await fusionnerSemaine(client, ["lundi", "mardi"]);

const lundi = await compterUniques(client, "lundi");
const semaine = await client.pfCount("hll:semaine");
console.log(`Uniques lundi : ${lundi} (réel : 1000) — semaine : ${semaine} (réel : 1500)`);
console.log(`Mémoire : Set = ${await client.memoryUsage("set:lundi")} octets, HLL = ${await client.memoryUsage("hll:lundi")} octets`);
verifier("Estimation lundi à ±3 % de 1000", Math.abs((lundi ?? 0) - 1000) <= 30, `Estimation obtenue : ${lundi}.`);
verifier("Fusion semaine à ±3 % de 1500", Math.abs(semaine - 1500) <= 45, semaine === 0 ? "La clé hll:semaine n'existe pas." : `Estimation obtenue : ${semaine}.`);

// B — utilisateurs 1 à 100 lundi, 51 à 150 mardi
for (let id = 1; id <= 100; id++) await marquerPresent(client, "lundi", id);
for (let id = 51; id <= 150; id++) await marquerPresent(client, "mardi", id);

verifier("L'utilisateur 42 est venu lundi", (await estVenu(client, "lundi", 42)) === 1);
verifier("L'utilisateur 42 n'est pas venu mardi", (await estVenu(client, "mardi", 42)) === 0);
const presents = await compterPresents(client, "lundi");
verifier("100 présents lundi", presents === 100, `Nombre obtenu : ${presents}.`);
const les2 = await presentsLesDeuxJours(client, "lundi", "mardi");
verifier("50 présents les deux jours", les2 === 50, `Nombre obtenu : ${les2}.`);

await client.quit();
