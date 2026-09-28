# Atelier 1 — Premiers pas avec redis-cli (20 min)

Ouvrez la console : `docker exec -it redis-lab redis-cli`

Faites les étapes ci-dessous **uniquement avec des commandes Redis**, puis vérifiez :

| Node.js | Java |
|---|---|
| `node ateliers/node/01-premiers-pas/verifier.js` | `mvn -q compile exec:java -Datelier=atelier01.Verifier` |

1. Créez la clé `formation:nom` avec la valeur `Redis NoSQL`.
2. Créez un compteur `formation:participants` à 0, puis augmentez-le **3 fois de 1**, sans jamais réécrire sa valeur.
3. Créez la clé `promo:code` avec la valeur `REDIS50`. Elle doit disparaître toute seule au bout de **5 minutes**.
4. Créez la clé `cache:page` qui expire dans 60 secondes, puis **annulez son expiration**.
5. Créez la clé `session:temp` (valeur libre), puis **supprimez-la**.
6. Créez les clés `user:1`, `user:2` et `user:3` (valeurs libres).
7. **Question :** sans utiliser `KEYS`, combien de clés commencent par `user:` ?
   Enregistrez votre réponse dans la clé `reponse:scan`.
8. **Question :** quel est le type Redis de `promo:code` ?
   Enregistrez votre réponse dans la clé `reponse:type`.

Pour recommencer à zéro, ajoutez `--reset` (Node) ou `-Dexec.args=--reset` (Java).
