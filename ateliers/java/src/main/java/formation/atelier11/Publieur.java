// ─────────────────────────────────────────────────────────────
// Atelier 11 — Pub/Sub : le publieur
// Lancer : mvn -q compile exec:java -Datelier=atelier11.Publieur
// (l'abonné doit tourner dans un autre terminal)
// ─────────────────────────────────────────────────────────────
package formation.atelier11;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;

public class Publieur {

    static final String CANAL = "notifications";

    public static long publier(Jedis jedis, String message) {
        // TODO Redis : publier le message sur CANAL et renvoyer la réponse
        //              de Redis (= nombre d'abonnés qui l'ont reçu)
        return 0;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            String[] messages = {"Commande #1 validée", "Commande #2 expédiée", "Commande #3 livrée"};
            long recus = 0;
            for (String m : messages) {
                long n = publier(jedis, m);
                System.out.println("→ \"" + m + "\" reçu par " + n + " abonné(s)");
                recus += n;
            }
            Lab.verifier("Les messages ont été reçus par au moins un abonné", recus >= messages.length,
                "L'abonné tourne-t-il ? Sinon les messages sont perdus : Pub/Sub ne stocke rien.");
        }
    }
}
