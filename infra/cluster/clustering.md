# Démo Redis Cluster : slots, redirections, hash tags et pannes

Lab : 6 nœuds Redis en mode cluster, soit 3 masters et 3 replicas. Toutes les commandes se lancent **depuis le dossier `infra/cluster/`**.

| Conteneur | IP (réseau du lab) | Port publié | Rôle après création |
|---|---|---|---|
| `redis-node-1` | 172.32.0.11 | 7001 | master, slots 0 – 5460 |
| `redis-node-2` | 172.32.0.12 | 7002 | master, slots 5461 – 10922 |
| `redis-node-3` | 172.32.0.13 | 7003 | master, slots 10923 – 16383 |
| `redis-node-4` | 172.32.0.14 | 7004 | replica |
| `redis-node-5` | 172.32.0.15 | 7005 | replica |
| `redis-node-6` | 172.32.0.16 | 7006 | replica |

> Les redirections renvoient les **IP internes** (172.32.0.x), que la machine hôte ne peut pas joindre.
> Pour les commandes de données, on passe donc toujours par `docker exec … redis-cli`, depuis un conteneur.

> **Git Bash (Windows / MINGW64) :** si `docker exec -it` répond `the input device is not a TTY`, préfixez la commande par `winpty` :
> `winpty docker exec -it redis-node-1 redis-cli -c`

---

## 1. Démarrer les nœuds

```bash
docker compose up -d
docker compose ps
```

Les 6 conteneurs doivent être `Up`. À ce stade, ce sont 6 Redis **indépendants** : le cluster n'existe pas encore.

```bash
docker exec redis-node-1 redis-cli CLUSTER INFO
```

Attendu : `cluster_state:fail`, `cluster_slots_assigned:0`, `cluster_known_nodes:1`.

---

## 2. Créer le cluster (une seule fois)

Sur **une seule ligne** :

```bash
docker exec -it redis-node-1 redis-cli --cluster create 172.32.0.11:6379 172.32.0.12:6379 172.32.0.13:6379 172.32.0.14:6379 172.32.0.15:6379 172.32.0.16:6379 --cluster-replicas 1 --cluster-yes
```

- `--cluster-replicas 1` : 1 replica par master. Les 3 premiers nœuds deviennent masters, les 3 suivants replicas.
- `--cluster-yes` : accepte automatiquement la répartition proposée.

Fin de sortie attendue :

```
M: 713c…  172.32.0.11:6379   slots:[0-5460] (5461 slots) master
M: 91aa…  172.32.0.12:6379   slots:[5461-10922] (5462 slots) master
M: 3017…  172.32.0.13:6379   slots:[10923-16383] (5461 slots) master
S: fbb5…  172.32.0.15:6379   replicates 713c…
…
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

> Si vous relancez la création sur un cluster existant : `ERR … is not empty`. Pour repartir de zéro :
> `docker compose down -v && docker compose up -d`, puis recréez le cluster.

---

## 3. Explorer le cluster

```bash
docker exec -it redis-node-1 redis-cli
```

```
127.0.0.1:6379> CLUSTER INFO
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_known_nodes:6
cluster_size:3

127.0.0.1:6379> CLUSTER NODES
3017… 172.32.0.13:6379@16379 master - 0 … 3 connected 10923-16383
91aa… 172.32.0.12:6379@16379 master - 0 … 2 connected 5461-10922
fbb5… 172.32.0.15:6379@16379 slave 713c… 0 … 1 connected
8df5… 172.32.0.16:6379@16379 slave 91aa… 0 … 2 connected
c758… 172.32.0.14:6379@16379 slave 3017… 0 … 3 connected
713c… 172.32.0.11:6379@16379 myself,master - 0 … 1 connected 0-5460
```

Lecture d'une ligne de `CLUSTER NODES` :

| Champ | Exemple | Signification |
|---|---|---|
| ID | `713c…` | Identifiant unique du nœud |
| Adresse | `172.32.0.11:6379@16379` | Port client, puis port du bus cluster (port client + 10000) |
| Flags | `myself,master` | Rôle ; `myself` = le nœud interrogé ; `fail` = nœud en panne |
| Master suivi | `713c…` | Pour un replica : l'ID de son master |
| Slots | `0-5460` | Plage de slots gérée (masters uniquement) |

> **Exercice :** retrouvez, pour chaque replica, quel master il réplique. L'association peut varier d'une création à l'autre.

Quittez avec `exit`.

---

## 4. Le calcul du slot et la redirection MOVED

Console **sans** l'option `-c` :

```bash
docker exec -it redis-node-1 redis-cli
```

```
127.0.0.1:6379> CLUSTER KEYSLOT commande:42
(integer) 2704                     ← slot 0 – 5460 : c'est ce nœud
127.0.0.1:6379> SET commande:42 validee
OK

127.0.0.1:6379> CLUSTER KEYSLOT user:1
(integer) 10778                    ← slot 5461 – 10922 : nœud 2
127.0.0.1:6379> SET user:1 anas
(error) MOVED 10778 172.32.0.12:6379
```

> **Slot = CRC16(clé) mod 16384.** Le nœud 1 ne stocke pas la clé : il indique au client **quel nœud** la gère.

---

## 5. Suivre les redirections avec `-c`

```bash
docker exec -it redis-node-1 redis-cli -c
```

```
127.0.0.1:6379> SET user:1 anas
-> Redirected to slot [10778] located at 172.32.0.12:6379
OK
172.32.0.12:6379> GET commande:42
-> Redirected to slot [2704] located at 172.32.0.11:6379
"validee"
172.32.0.11:6379>
```

> L'invite change à chaque redirection : la console vous « suit » de nœud en nœud.
> Dans une application, c'est la bibliothèque cliente qui fait ce travail (`JedisCluster` en Java, `createCluster` avec node-redis). Elle garde en mémoire la carte des slots et envoie directement chaque commande au bon nœud.

---

## 6. La répartition des données

Insérez 1 000 clés, puis comptez-les sur chaque master.

**Git Bash / bash**

```bash
for i in $(seq 1 1000); do echo "SET cle:$i $i"; done | docker exec -i redis-node-1 redis-cli -c > /dev/null
for n in 1 2 3; do echo "redis-node-$n : $(docker exec redis-node-$n redis-cli DBSIZE) clés"; done
```

**PowerShell**

```powershell
1..1000 | ForEach-Object { "SET cle:$_ $_" } | docker exec -i redis-node-1 redis-cli -c | Out-Null
1..3 | ForEach-Object { "redis-node-$_ : " + (docker exec redis-node-$_ redis-cli DBSIZE) + " clés" }
```

Attendu, à quelques clés près :

```
redis-node-1 : 340 clés
redis-node-2 : 324 clés
redis-node-3 : 336 clés
```

> Les clés se répartissent à peu près équitablement, sans aucune configuration : c'est le hash qui décide.
> Pour voir les clés d'un slot donné, sur le nœud qui le gère :
> `docker exec redis-node-2 redis-cli CLUSTER COUNTKEYSINSLOT 10778` puis `CLUSTER GETKEYSINSLOT 10778 10`

---

## 7. Opérations multi-clés : CROSSSLOT et hash tags

```bash
docker exec -it redis-node-1 redis-cli -c
```

```
127.0.0.1:6379> MSET user:1:nom anas user:2:nom hugo
(error) CROSSSLOT Keys in request don't hash to the same slot

127.0.0.1:6379> CLUSTER KEYSLOT user:1:nom
(integer) 6124
127.0.0.1:6379> CLUSTER KEYSLOT user:2:nom
(integer) 14654
```

Les deux clés tombent sur des slots, donc sur des nœuds, différents. Redis refuse une commande qui toucherait plusieurs nœuds.

**Solution : les hash tags.** Seule la partie entre `{…}` sert au calcul du slot.

```
127.0.0.1:6379> CLUSTER KEYSLOT {user:1}:nom
(integer) 10778
127.0.0.1:6379> CLUSTER KEYSLOT {user:1}:email
(integer) 10778                    ← même slot que "user:1"

127.0.0.1:6379> MSET {user:1}:nom anas {user:1}:email anas@exemple.com
-> Redirected to slot [10778] located at 172.32.0.12:6379
OK
172.32.0.12:6379> MGET {user:1}:nom {user:1}:email
1) "anas"
2) "anas@exemple.com"
```

> La même contrainte s'applique aux transactions (`MULTI`/`EXEC`) et aux scripts Lua : toutes les clés doivent être sur le même slot.
> ⚠️ Un hash tag trop large (`{app}` sur toutes les clés) envoie **tout** sur un seul nœud, qui devient un point chaud : on perd l'intérêt du cluster.

---

## 8. Lire sur un replica

Par défaut, un replica redirige même les lectures vers son master. Repérez le replica du nœud 2 dans `CLUSTER NODES` (dans l'exemple : `172.32.0.16`, soit `redis-node-6`) :

```bash
docker exec -it redis-node-6 redis-cli
```

```
127.0.0.1:6379> GET user:1
(error) MOVED 10778 172.32.0.12:6379
127.0.0.1:6379> READONLY
OK
127.0.0.1:6379> GET user:1
"anas"                             ← lecture servie par le replica
```

> `READONLY` autorise cette connexion à lire sur le replica. On répartit ainsi la charge de lecture, au prix d'une donnée parfois légèrement en retard (réplication asynchrone).

---

## 9. Panne d'un master : bascule automatique

Ouvrez **2 terminaux**.

**Terminal 1 :** surveiller l'état des nœuds chaque seconde.

```bash
# Git Bash / bash
while true; do clear; docker exec redis-node-1 redis-cli CLUSTER NODES | awk '{print $2, $3}' | sort; sleep 1; done
```

```powershell
# PowerShell
while ($true) { Clear-Host; docker exec redis-node-1 redis-cli CLUSTER NODES | ForEach-Object { ($_ -split ' ')[1,2] -join ' ' } | Sort-Object; Start-Sleep 1 }
```

**Terminal 2 :** arrêter le master des slots 5461 – 10922, qui contient `user:1`.

```bash
docker stop redis-node-2
```

**Ce qu'on observe dans le terminal 1 :**

| Délai | État de `172.32.0.12` | État de son replica |
|---|---|---|
| 0 à 5 s | `master,fail?` (suspecté) | `slave` |
| 5 à 15 s | `master,fail` (confirmé par la majorité des masters) | `master` (promu) |

**Vérifier que les données sont toujours accessibles :**

```bash
docker exec redis-node-1 redis-cli -c GET user:1          # "anas"
docker exec redis-node-1 redis-cli CLUSTER INFO | head -1  # cluster_state:ok
```

> Le cluster a basculé seul, **sans Sentinel** : la détection et le vote sont intégrés au cluster. La panne est constatée par les autres masters (`cluster-node-timeout` = 5 s), puis le replica est élu à la majorité.

---

## 10. Retour de l'ancien master

```bash
docker start redis-node-2
```

Après quelques secondes, le terminal 1 montre `172.32.0.12` en **`slave`** : il revient comme replica du nœud qui l'a remplacé, et se resynchronise.

### Remettre la topologie d'origine (bascule manuelle)

Sur l'ancien master, devenu replica :

```bash
docker exec redis-node-2 redis-cli CLUSTER FAILOVER
```

Le terminal 1 montre l'échange des rôles, **sans aucune perte d'écriture** : la bascule manuelle attend que le replica ait tout rattrapé avant de prendre la main. C'est la méthode à utiliser pour une maintenance planifiée.

---

## 11. Perte d'un shard complet

Que se passe-t-il si un master **et** son replica tombent en même temps ?

```bash
docker exec redis-node-1 redis-cli CLUSTER NODES | grep 10923   # repérer le master des slots 10923-16383 (node-3)
docker stop redis-node-3
docker stop <le replica de node-3>        # d'après CLUSTER NODES (dans l'exemple : redis-node-4)
```

Attendez une quinzaine de secondes :

```bash
docker exec redis-node-1 redis-cli CLUSTER INFO | head -1      # cluster_state:fail
docker exec redis-node-1 redis-cli -c GET user:2:nom           # CLUSTERDOWN The cluster is down
docker exec redis-node-1 redis-cli -c GET user:1               # CLUSTERDOWN aussi !
```

> Même les clés des shards **intacts** deviennent inaccessibles : par défaut (`cluster-require-full-coverage yes`), le cluster refuse de servir des données tant que les 16 384 slots ne sont pas couverts. Ce choix privilégie la cohérence.
> Avec `cluster-require-full-coverage no`, les autres shards continuent de répondre.

Redémarrez les deux nœuds :

```bash
docker start redis-node-3 <le replica de node-3>
```

Après quelques secondes : `cluster_state:ok`.

---

## 12. Resharding : déplacer des slots en ligne

On déplace 100 slots du nœud 1 vers le nœud 2, sans arrêter le service.

**Git Bash / bash**

```bash
FROM=$(docker exec redis-node-1 redis-cli CLUSTER MYID)
TO=$(docker exec redis-node-2 redis-cli CLUSTER MYID)
docker exec redis-node-1 redis-cli --cluster reshard 172.32.0.11:6379 --cluster-from $FROM --cluster-to $TO --cluster-slots 100 --cluster-yes
```

**PowerShell**

```powershell
$FROM = docker exec redis-node-1 redis-cli CLUSTER MYID
$TO   = docker exec redis-node-2 redis-cli CLUSTER MYID
docker exec redis-node-1 redis-cli --cluster reshard 172.32.0.11:6379 --cluster-from $FROM --cluster-to $TO --cluster-slots 100 --cluster-yes
```

> Si les sections 9 et 10 ont échangé des rôles, vérifiez d'abord que `redis-node-1` et `redis-node-2` sont bien des **masters**, sinon prenez les deux masters affichés par `CLUSTER NODES`.

Vérification :

```bash
docker exec redis-node-1 redis-cli CLUSTER NODES | grep master
```

```
… 172.32.0.11:6379 … master … 100-5460
… 172.32.0.12:6379 … master … 0-99 5461-10922     ← les 100 slots, et leurs clés, ont été déplacés
… 172.32.0.13:6379 … master … 10923-16383
```

> Pendant la migration d'un slot, un client qui demande une clé déjà déplacée reçoit une redirection **`ASK`** (temporaire), au lieu de `MOVED` (définitive).

Rééquilibrer automatiquement, puis vérifier la santé du cluster :

```bash
docker exec redis-node-1 redis-cli --cluster rebalance 172.32.0.11:6379
docker exec redis-node-1 redis-cli --cluster check 172.32.0.11:6379
```

> `rebalance` ne fait rien si l'écart est inférieur à 2 % (`*** No rebalancing needed!`). 100 slots sur 5 461, c'est en dessous du seuil.

---

## 13. Nettoyer

```bash
docker compose down -v
```

`-v` supprime aussi les volumes : le prochain `up` repartira d'un cluster vierge, à recréer.

---

## Pièges fréquents

| Symptôme | Cause | Solution |
|---|---|---|
| `(error) MOVED 10778 …` | Console sans `-c` | `redis-cli -c` |
| `CROSSSLOT Keys in request don't hash to the same slot` | Commande multi-clés sur plusieurs slots | Hash tags `{…}` |
| `the input device is not a TTY` | Git Bash (mintty) | Préfixer par `winpty` |
| `ERR … is not empty` à la création | Cluster déjà créé | `docker compose down -v`, puis recréer |
| `Could not connect to 172.32.0.x` depuis la machine hôte | IP internes au réseau Docker | Passer par `docker exec` |
| `CLUSTERDOWN The cluster is down` | Un shard entier (master + replica) est hors ligne | Redémarrer les nœuds du shard |
| La création reste bloquée sur `Waiting for the cluster to join` | Bus cluster (port 16379) injoignable | Vérifier que les 6 conteneurs sont sur le réseau `cluster_lab` |

---

## Points clés à retenir

- **16 384 slots** répartis entre les masters ; **slot = CRC16(clé) mod 16384**.
- **MOVED** = redirection définitive (le slot est ailleurs) ; **ASK** = redirection temporaire (slot en cours de migration).
- **Multi-clés, transactions et Lua** : toutes les clés doivent être sur le même slot, grâce aux **hash tags** `{…}`.
- **Haute disponibilité intégrée** : chaque master a son replica, et la bascule est automatique, sans Sentinel.
- **Perdre un shard complet** (master + replicas) rend tout le cluster indisponible par défaut.
- **Resharding en ligne** : on ajoute de la capacité en déplaçant des slots, sans interruption de service.
- **Sentinel ou Cluster ?** Cluster seulement si le volume de données ou d'écritures dépasse ce qu'une seule machine peut tenir. Sinon, master + replicas + Sentinel est plus simple.