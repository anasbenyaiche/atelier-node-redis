// Génère ateliers/<langage>/ à partir de corriges/<langage>/
// en supprimant tout ce qui se trouve entre les balises
//   --- solution ---   et   --- fin solution ---   (balises comprises).
// Usage : node tools/generer-ateliers.js [node]
import fs from "node:fs";
import path from "node:path";

const langage = process.argv[2] || "node";
const source = path.join("corriges", langage);
const cible = path.join("ateliers", langage);

let fichiers = 0, blocs = 0;

function traiter(dossier) {
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    const src = path.join(dossier, entree.name);
    const dst = path.join(cible, path.relative(source, src));
    if (entree.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); traiter(src); continue; }

    const lignes = fs.readFileSync(src, "utf8").split("\n");
    const sortie = [];
    let dansSolution = false;
    for (const ligne of lignes) {
      if (ligne.includes("--- fin solution ---")) { dansSolution = false; continue; }
      if (ligne.includes("--- solution ---")) {
        if (dansSolution) throw new Error(`Balise non fermée dans ${src}`);
        dansSolution = true; blocs++; continue;
      }
      if (!dansSolution) sortie.push(ligne);
    }
    if (dansSolution) throw new Error(`Balise non fermée dans ${src}`);
    fs.writeFileSync(dst, sortie.join("\n"));
    fichiers++;
  }
}

fs.rmSync(cible, { recursive: true, force: true });
fs.mkdirSync(cible, { recursive: true });
traiter(source);
console.log(`✔ ${fichiers} fichiers générés dans ${cible} (${blocs} blocs de solution retirés)`);
