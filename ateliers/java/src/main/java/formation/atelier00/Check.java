// ─────────────────────────────────────────────────────────────
// Atelier 0 — Vérification du lab
// Lancer : mvn -q compile exec:java -Datelier=atelier00.Check
// Rien à compléter : ce programme doit afficher 3 ✅.
// ─────────────────────────────────────────────────────────────
package formation.atelier00;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;

public class Check {
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            Lab.verifier("Redis répond au PING", "PONG".equals(jedis.ping()));

            jedis.set("lab:test", "ok");
            Lab.verifier("Écriture / lecture d'une clé", "ok".equals(jedis.get("lab:test")));

            String version = jedis.info("server").lines()
                    .filter(l -> l.startsWith("redis_version:"))
                    .findFirst().orElse("?:?").split(":")[1];
            Lab.verifier("Version de Redis : " + version, true);

            jedis.del("lab:test");
        }
    }
}
