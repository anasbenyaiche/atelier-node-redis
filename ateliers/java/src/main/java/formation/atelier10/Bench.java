// ─────────────────────────────────────────────────────────────
// Atelier 10 — Pipelining et commandes multi-arguments
// Lancer : mvn -q compile exec:java -Datelier=atelier10.Bench
//
// On écrit N clés de trois façons et on compare les temps :
//   1. une commande à la fois, en attendant chaque réponse (fourni)
//   2. toutes les commandes envoyées d'un coup en pipeline
//   3. une seule commande multi-arguments (MSET)
// ─────────────────────────────────────────────────────────────
package formation.atelier10;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Pipeline;

public class Bench {

    static final int N = 10_000;

    // 1. Sans pipeline : 1 aller-retour réseau par commande (déjà écrit)
    public static void sansPipeline(Jedis jedis) {
        for (int i = 0; i < N; i++) {
            jedis.set("bench:a:" + i, String.valueOf(i));
        }
    }

    // 2. Avec pipeline
    public static void avecPipeline(Jedis jedis) {
        // TODO Redis : préparer les N commandes SET "bench:b:<i>" dans un
        //              pipeline, puis les envoyer en une fois
        // Indice : jedis.pipelined() renvoie un Pipeline ; appelez set(...) dessus,
        //          puis sync() pour tout envoyer et attendre les réponses
    }

    // 3. Une seule commande multi-arguments
    public static void avecMset(Jedis jedis) {
        String[] clesValeurs = new String[N * 2];
        for (int i = 0; i < N; i++) {
            clesValeurs[2 * i] = "bench:c:" + i;
            clesValeurs[2 * i + 1] = String.valueOf(i);
        }
        // TODO Redis : écrire toutes les clés de "clesValeurs" (clé1, valeur1, clé2, valeur2…)
        //              en UNE commande
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    static long chrono(String libelle, Runnable r) {
        long t0 = System.nanoTime();
        r.run();
        long ms = (System.nanoTime() - t0) / 1_000_000;
        System.out.printf("%-16s : %d ms%n", libelle, ms);
        return ms;
    }

    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            jedis.del("bench:b:" + (N - 1), "bench:c:" + (N - 1)); // repartir de zéro pour la vérification

            long t1 = chrono("Sans pipeline", () -> sansPipeline(jedis));
            long t2 = chrono("Avec pipeline", () -> avecPipeline(jedis));
            chrono("MSET", () -> avecMset(jedis));

            boolean pipelineOk = String.valueOf(N - 1).equals(jedis.get("bench:b:" + (N - 1)));
            Lab.verifier("Pipeline : les N clés sont écrites", pipelineOk,
                "La dernière clé bench:b:" + (N - 1) + " n'existe pas : avez-vous appelé sync() ?");
            Lab.verifier("MSET : les N clés sont écrites", String.valueOf(N - 1).equals(jedis.get("bench:c:" + (N - 1))),
                "La dernière clé bench:c:" + (N - 1) + " n'existe pas.");
            Lab.verifier(String.format("Pipeline plus rapide que sans pipeline (x%.1f)", (double) t1 / Math.max(t2, 1)),
                pipelineOk && t2 < t1);
        }
    }
}
