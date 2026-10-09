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

verifier("10 requêtes autorisées", resultats.filter((r) => r === 1).length === 10);
verifier("2 requêtes refusées", resultats.filter((r) => r === 0).length === 2);
const ttl = await client.ttl("limite:alice");
verifier(`La clé expire bien (TTL = ${ttl} s)`, ttl > 0 && ttl <= 60);

await client.quit();
