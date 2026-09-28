# Formation Redis NoSQL — Ateliers pratiques

Code des ateliers de la formation **Redis NoSQL, mise en œuvre** (2 jours).
Les énoncés détaillés sont dans le **cahier d'ateliers**. Ce dépôt contient l'environnement du lab et le code à compléter.

## Prérequis

- Docker et Docker Compose
- Node.js 18 ou plus récent

## Démarrage (atelier 0)

```bash
npm install
docker compose up -d          # démarre le Redis du lab (port 6379)
npm run lab                   # doit afficher 3 ✅
docker exec -it redis-lab redis-cli   # console Redis
```

## Principe des ateliers de code

Chaque fichier est déjà écrit : fonctions, connexion, données de test et affichage.
**Vous complétez uniquement les blocs `// TODO Redis`.** Un indice indique la famille de commandes à utiliser.

En fin de fichier, un programme de test affiche ✅ ou ❌ pour chaque vérification. L'atelier est terminé quand tout est ✅.

> **Rappel node-redis :** une commande Redis s'écrit en camelCase.
> `HINCRBY` → `client.hIncrBy(...)`, `ZADD` → `client.zAdd(...)`, `PFCOUNT` → `client.pfCount(...)`

## Liste des ateliers

| # | Atelier | Type | Fichier / lab |
|---|---|---|---|
| 0 | Mise en place du lab | Console | `ateliers/node/00-verification/check.js` |
| 1 | Premiers pas : clés, TTL, SCAN | Console | `docker-compose.yml` |
| 2 | Les 5 structures de données | Console | `docker-compose.yml` |
| 3A | Votes avec un Hash | Code | `ateliers/node/03-structures/votes.js` |
| 3B | Classement avec un Sorted Set | Code | `ateliers/node/03-structures/classement.js` |
| 4 | Persistance RDB / AOF | Console | `docker-compose.yml` |
| 5 | Réplication master / replica | Console | `infra/replication/` |
| 6 | Virement : MULTI/EXEC et WATCH | Code | `ateliers/node/06-transactions/virement.js` |
| 7 | Limiteur de requêtes en Lua | Code | `ateliers/node/07-lua/limiteur.js` |
| 8 | Sentinel : bascule du master | Console | `infra/sentinel/` |
| 9 | Cluster : redirections et hash tags | Console | `infra/cluster/` |
| 10 | Pipeline et MSET | Code | `ateliers/node/10-pipeline/pipeline.js` |
| 11 | Pub/Sub | Code + console | `ateliers/node/11-pubsub/` (2 terminaux) |
| 12 | Visiteurs : HyperLogLog et Bitmap | Code | `ateliers/node/12-comptage/visiteurs.js` |
| 13 | Monitoring : MONITOR, SLOWLOG, INFO | Console | `docker-compose.yml` |
| 14 | Sécurité : mot de passe et ACL | Console | `infra/securite/` |

Lancer un atelier de code : `node ateliers/node/<dossier>/<fichier>.js`

## Ports utilisés

| Lab | Ports |
|---|---|
| Principal | 6379 |
| Réplication | 6380 à 6382 |
| Sentinel | réseau interne (utiliser `docker exec`) |
| Cluster | 7001 à 7006 (utiliser `docker exec … redis-cli -c`) |
| Sécurité | 6400 (mot de passe : `formation`) |

Pour libérer les ressources, arrêtez un lab avant d'en démarrer un autre : `docker compose down` dans son dossier.

---

## Pour le formateur

```
corriges/node/   ← SOURCE : code complet, solutions entre balises
ateliers/node/   ← GÉNÉRÉ : mêmes fichiers, solutions retirées
tools/           ← génération et vérification
infra/           ← labs Docker (réplication, sentinel, cluster, sécurité)
```

- **Ne jamais modifier `ateliers/` à la main.** Modifiez `corriges/`, puis lancez `npm run generer`.
- Une solution s'écrit entre deux balises. Le générateur supprime tout le bloc :
  ```js
  // TODO Redis : ce que le stagiaire doit faire
  // Indice : la famille de commandes
  // --- solution ---
  return client.hIncrBy(`link:${id}`, "score", 1);
  // --- fin solution ---
  ```
- `npm run verifier:corriges` lance tous les corrigés : tout doit être ✅ (28 vérifications).
- `npm run verifier:ateliers` lance les ateliers non complétés : on doit voir des ❌.
- **Distribution :** ne donnez pas `corriges/` aux stagiaires. Par exemple, publiez une branche `stagiaires` sans ce dossier ni `tools/`.

Java (Jedis) : à venir dans `corriges/java/` et `ateliers/java/`, avec la même structure et les mêmes vérifications.
