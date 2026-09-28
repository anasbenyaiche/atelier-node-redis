// ─────────────────────────────────────────────────────────────
// Atelier 3A — Système de votes avec un HASH
// Lancer : mvn -q compile exec:java -Datelier=atelier03.Votes
//
// Chaque lien est stocké dans un hash "link:<id>" avec les champs
// author, title, url et score.
// Complétez uniquement les blocs "TODO Redis".
// Rappel Jedis : la méthode porte le nom de la commande Redis
//                (ex. XYZADD → jedis.xyzadd(...)) — l'autocomplétion aide.
// ─────────────────────────────────────────────────────────────
package formation.atelier03;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;

import java.util.Map;

public class Votes {

    public static void enregistrerLien(Jedis jedis, int id, String author, String title, String url) {
        // TODO Redis : créer le hash "link:<id>" avec les 4 champs (score = 0)
        // Indice : une seule commande H… accepte plusieurs champs d'un coup (via une Map)
    }

    public static long voterPour(Jedis jedis, int id) {
        // TODO Redis : augmenter le champ "score" de 1 (de façon atomique)
        // Indice : une commande H… qui incrémente un champ
        return 0;
    }

    public static long voterContre(Jedis jedis, int id) {
        // TODO Redis : diminuer le champ "score" de 1
        // Indice : la même commande que ci-dessus suffit
        return 0;
    }

    public static Map<String, String> lireLien(Jedis jedis, int id) {
        // TODO Redis : récupérer TOUS les champs du hash sous forme de Map
        return null;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            jedis.del("link:123", "link:456");

            enregistrerLien(jedis, 123, "anas", "Doc Redis", "https://redis.io/docs");
            voterPour(jedis, 123);
            voterPour(jedis, 123);
            enregistrerLien(jedis, 456, "hugo", "Blog Redis", "https://redis.io/blog");
            voterPour(jedis, 456);
            voterContre(jedis, 456);

            Map<String, String> lien = lireLien(jedis, 123);
            System.out.println("Lien 123 : " + lien);

            String titre = jedis.hget("link:123", "title");
            String s123 = jedis.hget("link:123", "score");
            String s456 = jedis.hget("link:456", "score");

            Lab.verifier("enregistrerLien : le hash link:123 contient le titre", "Doc Redis".equals(titre),
                jedis.exists("link:123") ? "Le hash existe mais le champ title est incorrect." : "Le hash link:123 n'existe pas.");
            Lab.verifier("voterPour : score du lien 123 = 2", "2".equals(s123), "Score actuel : " + s123 + ".");
            Lab.verifier("voterContre : score du lien 456 = 0 (1 vote pour, 1 contre)", "0".equals(s456),
                "Score actuel : " + s456 + ". " + ("2".equals(s456) ? "voterContre augmente au lieu de diminuer." : ""));
            Lab.verifier("lireLien : renvoie une Map avec tous les champs",
                lien != null && "anas".equals(lien.get("author")) && lien.containsKey("url"),
                lien == null ? "La méthode renvoie null." : "La Map renvoyée est incomplète.");
        }
    }
}
