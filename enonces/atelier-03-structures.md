# Atelier 3 — Mini-cas en code : Hash et Sorted Set (40 min)

Choisissez **un** des deux cas. L'autre est un bonus si vous avez le temps.
Le code est déjà écrit : complétez uniquement les blocs `// TODO Redis`.

Avant de coder, vous pouvez tester chaque commande dans `redis-cli` pour voir ce qu'elle renvoie.

> **Rappel des noms de méthodes :**
> - **node-redis** : la commande en camelCase. `SADD` devient `client.sAdd(...)`, `LRANGE` devient `client.lRange(...)`.
> - **Jedis** : la commande en minuscules. `SADD` devient `jedis.sadd(...)`, `LRANGE` devient `jedis.lrange(...)`. L'autocomplétion de l'IDE aide.

---

## Cas A — Système de votes (Hash)
| | Fichier | Lancer |
|---|---|---|
| Node.js | `ateliers/node/03-structures/votes.js` | `node ateliers/node/03-structures/votes.js` |
| Java | `ateliers/java/src/main/java/formation/atelier03/Votes.java` | `mvn -q compile exec:java -Datelier=atelier03.Votes` |

Un site de partage de liens stocke chaque lien dans un hash `link:<id>` avec les champs `author`, `title`, `url` et `score`.

| Fonction | À faire |
|---|---|
| `enregistrerLien` | Créer le hash avec ses 4 champs, score à 0, **en une seule commande** |
| `voterPour` | Augmenter le score de 1 **sans lire la valeur avant** |
| `voterContre` | Diminuer le score de 1 |
| `lireLien` | Renvoyer tous les champs du lien (objet en Node, `Map` en Java) |

**Vérifier :** lancez le programme → 4 ✅

**Pour réfléchir :** pourquoi ne pas lire le score, ajouter 1 en JavaScript, puis le réécrire ?

---

## Cas B — Classement de joueurs (Sorted Set)
| | Fichier | Lancer |
|---|---|---|
| Node.js | `ateliers/node/03-structures/classement.js` | `node ateliers/node/03-structures/classement.js` |
| Java | `ateliers/java/src/main/java/formation/atelier03/Classement.java` | `mvn -q compile exec:java -Datelier=atelier03.Classement` |

Un jeu garde son classement dans le sorted set `classement:jeu` (membre = nom du joueur, score = points).

| Fonction | À faire |
|---|---|
| `ajouterJoueur` | Ajouter un joueur avec ses points |
| `ajouterPoints` | Ajouter des points au score actuel d'un joueur |
| `top` | Renvoyer les `n` meilleurs joueurs avec leur score, du meilleur au moins bon |
| `rang` | Renvoyer la position d'un joueur (**1** = premier) |

**Vérifier :** lancez le programme → 4 ✅

**Pour réfléchir :** quelle est la complexité de l'ajout d'un joueur quand le classement contient 1 million de joueurs ?
