# Démo Redis Sentinel : bascule automatique du master

Lab : 1 master, 2 replicas et 3 sentinelles. Toutes les commandes se lancent **depuis le dossier `infra/sentinel/`**.

| Rôle | Conteneur | IP (réseau du lab) | Port |
|---|---|---|---|
| Master | `sent-master` | 172.31.0.10 | 6379 |
| Replica 1 | `sent-replica-1` | 172.31.0.11 | 6379 |
| Replica 2 | `sent-replica-2` | 172.31.0.12 | 6379 |
| Sentinelle 1 | `sentinel-1` | 172.31.0.21 | 26379 |
| Sentinelle 2 | `sentinel-2` | 172.31.0.22 | 26379 |
| Sentinelle 3 | `sentinel-3` | 172.31.0.23 | 26379 |

Configuration des sentinelles (`sentinel.conf`) :

| Directive | Valeur | Rôle |
|---|---|---|
| `sentinel monitor mymaster 172.31.0.10 6379 2` | quorum = 2 | Surveille le master nommé `mymaster` ; 2 sentinelles doivent constater la panne |
| `sentinel down-after-milliseconds mymaster 5000` | 5 s | Délai sans réponse avant de soupçonner une panne |
| `sentinel failover-timeout mymaster 15000` | 15 s | Durée maximale d'une bascule |
| `sentinel parallel-syncs mymaster 1` | 1 | Replicas resynchronisés un par un après la bascule |

> ⚠️ Ces lignes sont des **directives du fichier de configuration**, déjà chargées au démarrage.
> Ne les tapez pas dans `redis-cli` :
> - `port 26379` y donne `ERR unknown command 'port'` ;
> - `SENTINEL MONITOR mymaster …` y donne `ERR Duplicate master name`, ce qui prouve d'ailleurs que `mymaster` est déjà surveillé.

---

## 1. Démarrer le lab

```bash
docker compose up -d
docker compose ps
```

Les 6 conteneurs doivent être `Up`. **Attendez une dizaine de secondes** : les sentinelles se découvrent entre elles via le master.

---

## 2. Vérifier que tout est en place

### Côté réplication

```bash
docker exec sent-master redis-cli INFO replication
```

Attendu : `role:master` et `connected_slaves:2`.

### Côté Sentinel

```bash
docker exec -it sentinel-1 redis-cli -p 26379
```

```
127.0.0.1:26379> SENTINEL get-master-addr-by-name mymaster
1) "172.31.0.10"
2) "6379"

127.0.0.1:26379> SENTINEL replicas mymaster       # 2 entrées : 172.31.0.11 et 172.31.0.12
127.0.0.1:26379> SENTINEL sentinels mymaster      # 2 entrées : les deux autres sentinelles
127.0.0.1:26379> SENTINEL master mymaster         # état détaillé
127.0.0.1:26379> SENTINEL ckquorum mymaster
OK 3 usable Sentinels. Quorum and failover authorization can be reached
```

Dans `SENTINEL master mymaster`, contrôlez :

| Champ | Valeur attendue |
|---|---|
| `flags` | `master` |
| `num-slaves` | `2` |
| `num-other-sentinels` | `2` |
| `quorum` | `2` |

> Si `num-other-sentinels` vaut `0`, les sentinelles ne se sont pas encore découvertes : attendez quelques secondes et recommencez.

Quittez la console avec `exit`.

---

## 3. La démo de bascule (3 terminaux)

### Terminal 1 : suivre les 3 sentinelles

```bash
docker compose logs -f sentinel-1 sentinel-2 sentinel-3
```

> On suit les trois sentinelles : une seule est élue **leader** et pilote la bascule. C'est dans son journal qu'on voit la séquence complète.

### Terminal 2 : afficher l'adresse du master chaque seconde

**bash**

```bash
while true; do docker exec sentinel-1 redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster | tr '\n' ' '; echo; sleep 1; done
```

**PowerShell**

```powershell
while ($true) { (docker exec sentinel-1 redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster) -join ' '; Start-Sleep 1 }
```

On voit défiler `172.31.0.10 6379`.

### Terminal 3 : écrire une donnée, puis provoquer la panne

```bash
docker exec sent-master redis-cli SET commande:42 validee
docker stop sent-master
```

### Ce qu'on observe (10 à 20 secondes)

**Terminal 1 : la séquence de bascule**

```
+sdown master mymaster 172.31.0.10 6379                      ← chaque sentinelle soupçonne la panne (après 5 s)
+odown master mymaster 172.31.0.10 6379 #quorum 2/2           ← quorum atteint : panne confirmée
+new-epoch 1
+try-failover master mymaster 172.31.0.10 6379
+vote-for-leader <id> 1                                       ← élection d'une sentinelle leader
+elected-leader master mymaster 172.31.0.10 6379
+selected-slave slave 172.31.0.11:6379 …                      ← replica choisi
+promoted-slave slave 172.31.0.11:6379 …                      ← REPLICAOF NO ONE envoyé
+slave-reconf-sent / +slave-reconf-done …                     ← l'autre replica suit le nouveau master
+switch-master mymaster 172.31.0.10 6379 172.31.0.11 6379     ← bascule terminée
```

| Événement | Signification |
|---|---|
| `+sdown` | *Subjectively down* : **une** sentinelle pense que le master est tombé |
| `+odown` | *Objectively down* : le quorum (2) est atteint, la panne est confirmée |
| `+vote-for-leader` / `+elected-leader` | Les sentinelles élisent à la **majorité** celle qui pilote la bascule |
| `+selected-slave` | Le meilleur replica est choisi (priorité, puis offset de réplication le plus avancé) |
| `+promoted-slave` | Le replica choisi devient master |
| `+switch-master` | Nouvelle adresse du master, annoncée aux clients |

**Terminal 2 :** l'adresse passe de `172.31.0.10` à `172.31.0.11` (ou `172.31.0.12`).

---

## 4. Vérifier le nouveau master

Dans la suite, on suppose que c'est `172.31.0.11`, c'est-à-dire `sent-replica-1`. Sinon, utilisez `sent-replica-2`.

```bash
docker exec sent-replica-1 redis-cli INFO replication      # role:master, connected_slaves:1
docker exec sent-replica-1 redis-cli GET commande:42       # "validee"  → aucune donnée perdue
docker exec sent-replica-1 redis-cli SET apres:bascule ok  # OK        → les écritures sont acceptées
```

Le second replica suit automatiquement le nouveau master :

```bash
docker exec sent-replica-2 redis-cli INFO replication      # role:slave, master_host:172.31.0.11
docker exec sent-replica-2 redis-cli GET apres:bascule     # "ok"
```

---

## 5. Retour de l'ancien master

```bash
docker start sent-master
```

**Terminal 1 :**

```
-sdown slave 172.31.0.10:6379 …
+convert-to-slave slave 172.31.0.10:6379 …     ← Sentinel le rétrograde en replica
```

Vérification, après quelques secondes :

```bash
docker exec sent-master redis-cli INFO replication     # role:slave, master_host:172.31.0.11
docker exec sent-master redis-cli GET apres:bascule    # "ok" : il a rattrapé les écritures
docker exec sent-master redis-cli SET test 1           # (error) READONLY
```

> Il n'y a jamais deux masters en même temps : l'ancien master revient en replica.

---

## 6. Bascule manuelle, sans panne (maintenance planifiée)

```bash
docker exec sentinel-1 redis-cli -p 26379 SENTINEL FAILOVER mymaster
```

Le terminal 2 montre le master qui change à nouveau, sans qu'aucun nœud ne soit arrêté. C'est utile avant une mise à jour ou un redémarrage de la machine du master.

---

## 7. Nettoyer

Arrêtez les boucles des terminaux 1 et 2 avec `Ctrl+C`, puis :

```bash
docker compose down
```

---

## Pièges fréquents

| Symptôme | Cause | Solution |
|---|---|---|
| `ERR Duplicate master name` | `SENTINEL MONITOR` tapé dans la console | Rien à faire : `mymaster` est déjà configuré dans `sentinel.conf` |
| `ERR unknown command 'port'` | Directive de fichier tapée dans la console | Les directives se lisent, elles ne se tapent pas |
| `num-other-sentinels:0` | Sentinelles pas encore découvertes | Attendre une dizaine de secondes |
| Aucune bascule après `docker stop` | Quorum non atteint (une seule sentinelle démarrée) | `docker compose ps` : les 3 sentinelles doivent être `Up` |
| Les logs de `sentinel-1` montrent seulement `+sdown`, `+odown` et `+switch-master` | `sentinel-1` n'est pas le leader élu | Suivre les 3 sentinelles avec `docker compose logs -f` |

---

## Points clés à retenir

- **Au moins 3 sentinelles, en nombre impair**, sur des machines différentes : la bascule nécessite l'accord d'une **majorité**. Avec 3 sentinelles, on tolère la perte d'une seule.
- **Quorum ≠ majorité** : le quorum (2) sert à **déclarer** la panne (`+odown`) ; la majorité des sentinelles sert à **élire le leader** qui lance la bascule.
- **L'application ne code jamais l'adresse du master en dur** : elle demande à Sentinel l'adresse du master actuel (`JedisSentinelPool` en Java, `createSentinel` avec node-redis).
- **Split-brain** : un master isolé qui reçoit encore des écritures les perd quand il revient en replica. On limite ce risque avec `min-replicas-to-write 1` : un master qui ne voit plus aucun replica refuse les écritures.
- **Réplication asynchrone** : une écriture confirmée par le master mais pas encore transmise aux replicas peut être perdue lors d'une bascule.