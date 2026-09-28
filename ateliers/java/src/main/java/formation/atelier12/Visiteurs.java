// ─────────────────────────────────────────────────────────────
// Atelier 12 — Compter des visiteurs : HyperLogLog et Bitmap
// Lancer : mvn -q compile exec:java -Datelier=atelier12.Visiteurs
//
// Partie A (HyperLogLog) : compter les visiteurs UNIQUES d'un site,
//   avec une mémoire fixe (~12 Ko) quel que soit le nombre de visiteurs.
// Partie B (Bitmap) : savoir si l'utilisateur n°X est venu tel jour,
//   1 bit par utilisateur.
// ─────────────────────────────────────────────────────────────
package formation.atelier12;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.args.BitOP;

public class Visiteurs {

    // ── Partie A : HyperLogLog ──────────────────────────────
    public static void ajouterVisite(Jedis jedis, String jour, String visiteur) {
        // TODO Redis : ajouter le visiteur au HyperLogLog "hll:<jour>"
        // Indice : les commandes HyperLogLog commencent par PF…
    }

    public static long compterUniques(Jedis jedis, String jour) {
        // TODO Redis : renvoyer le nombre (estimé) de visiteurs uniques
        return 0;
    }

    public static void fusionnerSemaine(Jedis jedis, String... jours) {
        String[] sources = new String[jours.length];
        for (int i = 0; i < jours.length; i++) sources[i] = "hll:" + jours[i];
        // TODO Redis : fusionner les HyperLogLog "sources" dans "hll:semaine"
    }

    // ── Partie B : Bitmap ───────────────────────────────────
    public static void marquerPresent(Jedis jedis, String jour, long userId) {
        // TODO Redis : mettre à 1 le bit n° userId de la clé "presence:<jour>"
    }

    public static boolean estVenu(Jedis jedis, String jour, long userId) {
        // TODO Redis : lire le bit n° userId (true = 1, false = 0)
        return false;
    }

    public static long compterPresents(Jedis jedis, String jour) {
        // TODO Redis : compter le nombre de bits à 1
        return 0;
    }

    public static long presentsLesDeuxJours(Jedis jedis, String jour1, String jour2) {
        // TODO Redis : calculer un ET logique entre les deux bitmaps,
        //              stocker le résultat dans "presence:les2", puis compter ses bits
        // Indice : BITOP AND destination source1 source2 (en Java : BitOP.AND)
        return 0;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            jedis.del("hll:lundi", "hll:mardi", "hll:semaine", "set:lundi", "presence:lundi", "presence:mardi", "presence:les2");

            // A — 5 000 visites de 1 000 visiteurs différents
            for (int i = 0; i < 5000; i++) {
                String v = "user_" + (i % 1000);
                ajouterVisite(jedis, "lundi", v);
                jedis.sadd("set:lundi", v); // même chose dans un Set, pour comparer
            }
            for (int i = 500; i < 1500; i++) ajouterVisite(jedis, "mardi", "user_" + i);
            fusionnerSemaine(jedis, "lundi", "mardi");

            long lundi = compterUniques(jedis, "lundi");
            long semaine = jedis.exists("hll:semaine") ? jedis.pfcount("hll:semaine") : 0;
            System.out.println("Uniques lundi : " + lundi + " (réel : 1000) — semaine : " + semaine + " (réel : 1500)");
            System.out.println("Mémoire : Set = " + jedis.memoryUsage("set:lundi") + " octets, HLL = " + jedis.memoryUsage("hll:lundi") + " octets");
            Lab.verifier("Estimation lundi à ±3 % de 1000", Math.abs(lundi - 1000) <= 30, "Estimation obtenue : " + lundi + ".");
            Lab.verifier("Fusion semaine à ±3 % de 1500", Math.abs(semaine - 1500) <= 45,
                semaine == 0 ? "La clé hll:semaine n'existe pas." : "Estimation obtenue : " + semaine + ".");

            // B — utilisateurs 1 à 100 lundi, 51 à 150 mardi
            for (long id = 1; id <= 100; id++) marquerPresent(jedis, "lundi", id);
            for (long id = 51; id <= 150; id++) marquerPresent(jedis, "mardi", id);

            Lab.verifier("L'utilisateur 42 est venu lundi", estVenu(jedis, "lundi", 42));
            Lab.verifier("L'utilisateur 42 n'est pas venu mardi", jedis.exists("presence:mardi") && !estVenu(jedis, "mardi", 42),
                jedis.exists("presence:mardi") ? null : "Aucune présence enregistrée pour mardi.");
            long presents = compterPresents(jedis, "lundi");
            Lab.verifier("100 présents lundi", presents == 100, "Nombre obtenu : " + presents + ".");
            long les2 = presentsLesDeuxJours(jedis, "lundi", "mardi");
            Lab.verifier("50 présents les deux jours", les2 == 50, "Nombre obtenu : " + les2 + ".");
        }
    }
}
