// ─────────────────────────────────────────────────────────────
// Atelier 7 — Limiteur de requêtes en Lua
// Lancer : node ateliers/node/07-lua/limiteur.js
//
// Règle : un utilisateur a droit à LIMITE requêtes par fenêtre
// de FENETRE secondes. Le script Lua renvoie 1 (autorisé) ou 0 (refusé).
// Pourquoi Lua ? Les 3 étapes (incrémenter, poser le TTL, comparer)
// s'exécutent d'un bloc, sans qu'un autre client puisse s'intercaler.
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

// KEYS[1] = clé du compteur, ARGV[1] = limite, ARGV[2] = fenêtre (s)
const SCRIPT = `
  -- TODO Lua : incrémenter le compteur KEYS[1] et garder la valeur
  --            dans une variable locale "compteur"
  -- Indice : redis.call('NOM_COMMANDE', KEYS[1])

  -- TODO Lua : si c'est la 1re requête (compteur == 1),
  --            poser une expiration de ARGV[2] secondes sur la clé

  if compteur > tonumber(ARGV[1]) then
    return 0
  end
  return 1
`;

export async function autoriser(client, utilisateur, limite, fenetre) {
  const cle = `limite:${utilisateur}`;
  // TODO Redis : exécuter SCRIPT avec la clé "cle" et les arguments
  //              limite et fenetre (les arguments doivent être des strings)
  // Indice : client.eval(script, { keys: [...], arguments: [...] })
}

// ─── Programme de test (ne pas modifier) ─────────────────────
const client = await connecter();
await client.del("limite:alice");

const resultats = [];
for (let i = 1; i <= 12; i++) {
  resultats.push(await autoriser(client, "alice", 10, 60));
}
console.log("Réponses :", resultats.join(" "));

const ok = resultats.filter((r) => r === 1).length, refus = resultats.filter((r) => r === 0).length;
verifier("10 requêtes autorisées", ok === 10,
  resultats[0] === undefined ? "autoriser() ne renvoie rien : le script est-il exécuté (et renvoyé) ?" : `${ok} requêtes autorisées.`);
verifier("2 requêtes refusées", refus === 2, `${refus} requêtes refusées.`);
const ttl = await client.ttl("limite:alice");
verifier(`La clé expire bien (TTL = ${ttl} s)`, ttl > 0 && ttl <= 60,
  ttl === -1 ? "La clé n'a pas d'expiration : relisez le 2e TODO Lua." : "La clé n'existe pas.");

await client.quit();
