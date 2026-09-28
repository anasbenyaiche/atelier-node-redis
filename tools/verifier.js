// Lance tous les scripts d'un dossier (corriges ou ateliers) et compte les ✅ / ❌.
// Usage : node tools/verifier.js corriges/node      (tout doit être ✅)
//         node tools/verifier.js ateliers/node      (avant complétion : des ❌)
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";

const base = process.argv[2] || "corriges/node";
const scripts = [
  "00-verification/check.js",
  "03-structures/votes.js",
  "03-structures/classement.js",
  "06-transactions/virement.js",
  "07-lua/limiteur.js",
  "10-pipeline/pipeline.js",
  "12-comptage/visiteurs.js",
];

let ok = 0, ko = 0;
function compter(sortie) {
  ok += (sortie.match(/✅/g) || []).length;
  ko += (sortie.match(/❌/g) || []).length;
}

for (const s of scripts) {
  console.log(`\n▶ ${s}`);
  try {
    const out = execFileSync("node", [path.join(base, s)], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    process.stdout.write(out); compter(out);
  } catch (e) {
    process.stdout.write(e.stdout || ""); console.log(`❌ le script a planté : ${(e.stderr || "").split("\n").find((l) => l.includes("Error")) || e.message}`); ko++;
  }
}

// Pub/Sub : on lance l'abonné en arrière-plan puis le publieur
console.log("\n▶ 11-pubsub (abonné + publieur)");
const abonne = spawn("node", [path.join(base, "11-pubsub/abonne.js")], { stdio: "inherit" });
await new Promise((r) => setTimeout(r, 800));
try {
  const out = execFileSync("node", [path.join(base, "11-pubsub/publieur.js")], { encoding: "utf8" });
  await new Promise((r) => setTimeout(r, 300));
  process.stdout.write(out); compter(out);
} catch (e) { process.stdout.write(e.stdout || ""); ko++; }
abonne.kill("SIGINT");

console.log(`\n══════ Bilan ${base} : ${ok} ✅   ${ko} ❌ ══════`);
