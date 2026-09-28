// ─────────────────────────────────────────────────────────────
// Atelier 6 — Virement bancaire : MULTI/EXEC puis WATCH
// Lancer : node ateliers/node/06-transactions/virement.js
//
// Les soldes sont des strings : "compte:max" et "compte:hugo".
// Partie 1 : rendre le virement atomique avec MULTI / EXEC.
// Partie 2 : protéger la lecture du solde avec WATCH.
// ─────────────────────────────────────────────────────────────
import { WatchError } from "redis";
import { connecter, verifier } from "../lib/client.js";

// ── Partie 1 ────────────────────────────────────────────────
export async function virer(client, de, vers, montant) {
  const solde = Number(await client.get(de));
  if (solde < montant) throw new Error("Solde insuffisant");

  // TODO Redis : dans UNE transaction, retirer "montant" du compte "de"
  //              et l'ajouter au compte "vers". Renvoyer le résultat d'exec().
  // Indice : client.multi() puis chaînez deux commandes …BY, puis .exec()
}

// ── Partie 2 ────────────────────────────────────────────────
// "pendantLaDecision" simule un autre utilisateur qui agit
// entre la lecture du solde et l'exécution de la transaction.
// Doit renvoyer true si le virement est passé, false s'il a été annulé.
export async function virerProtege(client, de, vers, montant, pendantLaDecision) {
  // TODO Redis : surveiller la clé "de" AVANT de lire le solde

  const solde = Number(await client.get(de));
  await pendantLaDecision();
  if (solde < montant) throw new Error("Solde insuffisant");

  try {
    // TODO Redis : même transaction qu'en partie 1
    return true;
  } catch (err) {
    if (err instanceof WatchError) return false; // la clé a changé : annulé
    throw err;
  }
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();
const autreClient = client.duplicate(); // une 2e connexion = un autre utilisateur
await autreClient.connect();

// Partie 1
await client.mSet({ "compte:max": "100", "compte:hugo": "100" });
const res = await virer(client, "compte:max", "compte:hugo", 40);
console.log("Résultat de la transaction :", res);
verifier("P1 — Max a 60", (await client.get("compte:max")) === "60");
verifier("P1 — Hugo a 140", (await client.get("compte:hugo")) === "140");

// Partie 2
await client.mSet({ "compte:max": "100", "compte:hugo": "100" });
const passe = await virerProtege(client, "compte:max", "compte:hugo", 40, async () => {
  await autreClient.decrBy("compte:max", 80); // retrait concurrent !
  console.log("   (un autre client vient de retirer 80 à Max)");
});
verifier("P2 — le virement a été annulé par WATCH", passe === false);
verifier(
  "P2 — soldes intacts : Max 20 (seul le retrait concurrent), Hugo 100",
  passe === false && (await client.get("compte:max")) === "20" && (await client.get("compte:hugo")) === "100"
);

await autreClient.quit();
await client.quit();
