// ─────────────────────────────────────────────────────────────
// Atelier 11 — Pub/Sub : l'abonné
// Lancer dans un 1er terminal : mvn -q compile exec:java -Datelier=atelier11.Abonne
// Puis dans un 2e terminal    : mvn -q compile exec:java -Datelier=atelier11.Publieur
// (ou depuis redis-cli : PUBLISH notifications "bonjour")
// Arrêter avec Ctrl+C.
// ─────────────────────────────────────────────────────────────
package formation.atelier11;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPubSub;

public class Abonne {

    static final String CANAL = "notifications";

    public static void main(String[] args) {
        // Une connexion abonnée ne peut plus rien faire d'autre :
        // on utilise une connexion dédiée.
        Jedis abonne = Lab.connecter();

        JedisPubSub recepteur = new JedisPubSub() {
            @Override
            public void onMessage(String canal, String message) {
                System.out.println("📩 [" + canal + "] " + message);
            }

            @Override
            public void onSubscribe(String canal, int nbAbonnements) {
                System.out.println("👂 En écoute sur \"" + canal + "\"…");
            }
        };

        // TODO Redis : s'abonner au canal CANAL avec le récepteur ci-dessus
        //              (l'appel est bloquant : il écoute jusqu'à Ctrl+C)
        // Indice : jedis.subscribe(recepteur, canal)
    }
}
