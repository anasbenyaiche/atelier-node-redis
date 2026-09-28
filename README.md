# Formation Redis NoSQL — Ateliers pratiques

Code des ateliers de la formation **Redis NoSQL, mise en œuvre**.
Les énoncés sont dans le **cahier d'ateliers** remis en début de formation (et, pour certains, dans `enonces/`). Ce dépôt contient l'environnement du lab et le code à compléter.

## Prérequis

- Docker et Docker Compose
- **Node.js** 18 ou plus récent, **ou Java** 17 ou plus récent avec Maven 3.8 ou plus récent. Chaque stagiaire choisit son langage.

## Démarrage (atelier 0)

```bash
docker compose up -d                  # démarre le Redis du lab (port 6379)
docker exec -it redis-lab redis-cli   # console Redis
```

**Node.js** (depuis la racine du dépôt) :
```bash
npm install
npm run lab                           # doit afficher 3 ✅
```

**Java** (depuis `ateliers/java/`) :
```bash
mvn -q compile exec:java -Datelier=atelier00.Check     # doit afficher 3 ✅
```
Vous pouvez aussi ouvrir `ateliers/java/` dans IntelliJ ou VS Code et lancer le `main` de chaque atelier.

## Principe des ateliers de code

Chaque fichier est déjà écrit : fonctions, connexion, données de test et affichage.
**Vous complétez uniquement les blocs `// TODO Redis`.** Un indice indique la famille de commandes à utiliser.

En fin de fichier, un programme de test affiche ✅ ou ❌ pour chaque vérification. L'atelier est terminé quand tout est ✅.

> **Rappel des noms de méthodes :**
> - **node-redis** : la commande en camelCase. `HINCRBY` devient `client.hIncrBy(...)`.
> - **Jedis** : la commande en minuscules. `HINCRBY` devient `jedis.hincrBy(...)`, `ZADD` devient `jedis.zadd(...)`.

## Ateliers en console

Les ateliers en console ont aussi un vérificateur : faites les commandes dans `redis-cli`, puis lancez
`node ateliers/node/<dossier>/verifier.js` (Node) ou `mvn -q compile exec:java -Datelier=atelierXX.Verifier` (Java). Il lit l'état de Redis et affiche ✅ / ❌ avec un indice 💡.
L'option `--reset` (en Java : `-Dexec.args=--reset`) supprime les clés de l'atelier pour recommencer.

## Liste des ateliers

| # | Atelier | Type | Fichier / lab |
|---|---|---|---|
| 0 | Mise en place du lab | Console | `00-verification/check.js` / `atelier00/Check.java` |
| 1 | Premiers pas : clés, TTL, SCAN | Console | `01-premiers-pas/verifier.js` / `atelier01/Verifier.java` |
| 2 | Les 5 structures de données | Console | `docker-compose.yml` |
| 3A | Votes avec un Hash | Code | `03-structures/votes.js` / `atelier03/Votes.java` |
| 3B | Classement avec un Sorted Set | Code | `03-structures/classement.js` / `atelier03/Classement.java` |
| 4 | Persistance RDB / AOF | Console | `docker-compose.yml` |
| 5 | Réplication master / replica | Console | `infra/replication/` |
| 6 | Virement : MULTI/EXEC et WATCH | Code | `06-transactions/virement.js` / `atelier06/Virement.java` |
| 7 | Limiteur de requêtes en Lua | Code | `07-lua/limiteur.js` / `atelier07/Limiteur.java` |
| 8 | Sentinel : bascule du master | Console | `infra/sentinel/` |
| 9 | Cluster : redirections et hash tags | Console | `infra/cluster/` |
| 10 | Pipeline, MSET et encodages | Code | `10-pipeline/pipeline.js` / `atelier10/Bench.java` |
| 11 | Pub/Sub | Code + console | `11-pubsub/` / `atelier11/` (2 terminaux) |
| 12 | Visiteurs : HyperLogLog et Bitmap | Code | `12-comptage/visiteurs.js` / `atelier12/Visiteurs.java` |
| 13 | Monitoring : MONITOR, SLOWLOG, INFO | Console | `docker-compose.yml` |
| 14 | Sécurité : mot de passe et ACL | Console | `infra/securite/` |

Tous les ateliers de code existent en Node.js et en Java.

Lancer un atelier de code :
- Node : `node ateliers/node/<dossier>/<fichier>.js`
- Java : `mvn -q compile exec:java -Datelier=<package>.<Classe>`, depuis `ateliers/java/`

## Ports utilisés

| Lab | Ports |
|---|---|
| Principal | 6379 |
| Réplication | 6380 à 6382 |
| Sentinel | réseau interne (utiliser `docker exec`) |
| Cluster | 7001 à 7006 (utiliser `docker exec … redis-cli -c`) |
| Sécurité | 6400 (mot de passe : `formation`) |

Pour libérer les ressources, arrêtez un lab avant d'en démarrer un autre : `docker compose down` dans son dossier.
