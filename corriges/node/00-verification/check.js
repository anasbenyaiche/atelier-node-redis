// ─────────────────────────────────────────────────────────────
// Atelier 0 — Vérification du lab
// Lancer : node ateliers/node/00-verification/check.js
// Rien à compléter : ce script doit afficher 3 ✅.
// ─────────────────────────────────────────────────────────────
import { connecter, verifier } from "../lib/client.js";

const client = await connecter();

verifier("Redis répond au PING", (await client.ping()) === "PONG");

await client.set("lab:test", "ok");
verifier("Écriture / lecture d'une clé", (await client.get("lab:test")) === "ok");

const info = await client.info("server");
const version = info.match(/redis_version:(\S+)/)[1];
verifier(`Version de Redis : ${version}`, true);

await client.del("lab:test");
await client.quit();
