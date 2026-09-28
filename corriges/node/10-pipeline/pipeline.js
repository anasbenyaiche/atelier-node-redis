// ─────────────────────────────────────────────────────────────
// Atelier 10 — Pipelining et commandes multi-arguments
// Lancer : node ateliers/node/10-pipeline/pipeline.js
//
// On écrit N clés de trois façons et on compare les temps :
//   1. une commande à la fois, en attendant chaque réponse (fourni)
//   2. toutes les commandes envoyées d'un coup en pipeline
//   3. une seule commande multi-arguments (MSET)
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

const N = 10_000;

// 1. Sans pipeline : 1 aller-retour réseau par commande (déjà écrit)
export async function sansPipeline(client) {
  for (let i = 0; i < N; i++) {
    await client.set(`bench:a:${i}`, i);
  }
}

// 2. Avec pipeline
export async function avecPipeline(client) {
  // TODO Redis : préparer les N commandes SET "bench:b:<i>" dans un
  //              pipeline, puis l'envoyer en une fois
  // Indice : client.multi() … puis la méthode exec… « AsPipeline »
  //          (pas de transaction ici : juste un envoi groupé)
  // --- solution ---
  const pipeline = client.multi();
  for (let i = 0; i < N; i++) {
    pipeline.set(`bench:b:${i}`, i);
  }
  await pipeline.execAsPipeline();
  // --- fin solution ---
}

// 3. Une seule commande multi-arguments
export async function avecMset(client) {
  const valeurs = {};
  for (let i = 0; i < N; i++) valeurs[`bench:c:${i}`] = String(i);

  // TODO Redis : écrire toutes les clés de "valeurs" en UNE commande
  // --- solution ---
  await client.mSet(valeurs);
  // --- fin solution ---
}

// ─── Programme de test (ne pas modifier) ─────────────────────
async function chrono(libelle, fn) {
  const t0 = performance.now();
  await fn();
  const ms = Math.round(performance.now() - t0);
  console.log(`${libelle.padEnd(16)} : ${ms} ms`);
  return ms;
}

const client = await connecter();
await client.del([`bench:b:${N - 1}`, `bench:c:${N - 1}`]); // repartir de zéro pour la vérification

const t1 = await chrono("Sans pipeline", () => sansPipeline(client));
const t2 = await chrono("Avec pipeline", () => avecPipeline(client));
const t3 = await chrono("MSET", () => avecMset(client));

const pipelineOk = (await client.get(`bench:b:${N - 1}`)) === String(N - 1);
verifier("Pipeline : les N clés sont écrites", pipelineOk);
verifier("MSET : les N clés sont écrites", (await client.get(`bench:c:${N - 1}`)) === String(N - 1));
verifier(`Pipeline plus rapide que sans pipeline (x${(t1 / Math.max(t2, 1)).toFixed(1)})`, pipelineOk && t2 < t1);

await client.quit();
