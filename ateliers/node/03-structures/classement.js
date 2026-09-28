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
}

export async function ajouterPoints(client, nom, points) {
  // TODO Redis : ajouter des points au score actuel du joueur
}

export async function top(client, n) {
  // TODO Redis : renvoyer les n meilleurs joueurs AVEC leur score,
  //              du plus grand au plus petit
  // Indice : ZRANGE … avec l'option REV (méthode …WithScores)
}

export async function rang(client, nom) {
  // TODO Redis : renvoyer la position du joueur (1 = premier)
  // Indice : Redis compte à partir de 0 et il faut l'ordre décroissant
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

const nb = await client.zCard(CLE);
const bob = await client.zScore(CLE, "bob");
const rangChloe = await rang(client, "chloe");

verifier("ajouterJoueur : 4 joueurs dans le classement", nb === 4, `Nombre de joueurs : ${nb}.`);
verifier("ajouterPoints : bob a 190 points", bob === 190,
  bob === 90 ? "Les points n'ont pas été ajoutés." : bob === 100 ? "Le score a été remplacé au lieu d'être augmenté." : `Score de bob : ${bob}.`);
verifier("top : bob en premier, 3 joueurs", podium?.[0]?.value === "bob" && podium.length === 3,
  podium === undefined ? "La fonction ne renvoie rien (pensez au return)."
    : podium[0]?.value === "david" ? "L'ordre est inversé : il faut du plus grand au plus petit." : "Vérifiez les bornes (0 à n-1).");
verifier("rang : chloe est 2e", rangChloe === 2,
  rangChloe === undefined ? "La fonction ne renvoie rien (pensez au return)."
    : rangChloe === 1 ? "Redis compte à partir de 0 : il faut ajouter 1." : rangChloe === 3 ? "Il faut le rang en ordre décroissant." : `Rang obtenu : ${rangChloe}.`);

await client.quit();
