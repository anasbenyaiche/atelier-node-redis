// ─────────────────────────────────────────────────────────────
// Atelier 1 — Vérificateur (atelier en console)
// Lancer : node ateliers/node/01-premiers-pas/verifier.js
// Remise à zéro : node ateliers/node/01-premiers-pas/verifier.js --reset
// Ce script ne fait que LIRE l'état de Redis après vos commandes.
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

const CLES = [
  "formation:nom", "formation:participants", "promo:code", "cache:page",
  "session:temp", "user:1", "user:2", "user:3", "reponse:scan", "reponse:type",
];

const client = await connecter();

if (process.argv.includes("--reset")) {
  await client.del(CLES);
  console.log("🧹 Clés de l'atelier 1 supprimées : vous pouvez recommencer.");
  await client.quit();
  process.exit(0);
}

const etape = verifier;

const nom = await client.get("formation:nom");
etape("1. formation:nom = 'Redis NoSQL'", nom === "Redis NoSQL",
  nom === null ? "La clé n'existe pas." : "La valeur ne correspond pas (attention aux espaces et aux guillemets).");

const part = await client.get("formation:participants");
etape("2. formation:participants = 3", part === "3",
  part === null ? "La clé n'existe pas." : `Valeur actuelle : ${part}. Repartez de 0 et utilisez une commande d'incrémentation.`);

const promo = await client.get("promo:code");
const ttlPromo = await client.ttl("promo:code");
etape("3a. promo:code = 'REDIS50'", promo === "REDIS50", promo === null ? "La clé n'existe pas (ou a déjà expiré)." : null);
etape("3b. promo:code expire dans 5 minutes au plus", ttlPromo > 0 && ttlPromo <= 300,
  ttlPromo === -2 ? "La clé n'existe pas." : ttlPromo === -1 ? "La clé n'a pas d'expiration." : ttlPromo > 300 ? "L'expiration dépasse 5 minutes." : null);

const ttlCache = await client.ttl("cache:page");
etape("4. cache:page existe et n'expire plus", ttlCache === -1,
  ttlCache === -2 ? "La clé n'existe pas (a-t-elle expiré avant l'annulation ?)." : "La clé a encore une expiration.");

etape("5. session:temp a été supprimée", (await client.exists("session:temp")) === 0, "La clé existe encore.");

etape("6. user:1, user:2 et user:3 existent", (await client.exists(["user:1", "user:2", "user:3"])) === 3,
  "Il manque au moins une des trois clés.");

// Réponse attendue : on la calcule avec SCAN plutôt que de l'écrire en dur
let nbUser = 0;
for await (const cles of client.scanIterator({ MATCH: "user:*", COUNT: 100 })) nbUser += cles.length;
const repScan = await client.get("reponse:scan");
etape("7. reponse:scan contient le bon nombre", repScan !== null && Number(repScan) === nbUser,
  repScan === null ? "La clé reponse:scan n'existe pas." : "Mauvaise réponse : parcourez les clés avec SCAN et un motif (MATCH).");

const repType = (await client.get("reponse:type"))?.trim().toLowerCase();
const typeReel = await client.type("promo:code");
etape("8. reponse:type contient le bon type", repType !== undefined && repType === typeReel,
  repType === undefined ? "La clé reponse:type n'existe pas." : "Mauvaise réponse : une commande Redis donne le type d'une clé.");

await client.quit();
