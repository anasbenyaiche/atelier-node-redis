// ─────────────────────────────────────────────────────────────
// Atelier 7 — Limiteur de requêtes en Lua
// Lancer : mvn -q compile exec:java -Datelier=atelier07.Limiteur
//
// Règle : un utilisateur a droit à LIMITE requêtes par fenêtre
// de FENETRE secondes. Le script Lua renvoie 1 (autorisé) ou 0 (refusé).
// Pourquoi Lua ? Les 3 étapes (incrémenter, poser le TTL, comparer)
// s'exécutent d'un bloc, sans qu'un autre client puisse s'intercaler.
// ─────────────────────────────────────────────────────────────
package formation.atelier07;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;

import java.util.ArrayList;
import java.util.List;

public class Limiteur {

    // KEYS[1] = clé du compteur, ARGV[1] = limite, ARGV[2] = fenêtre (s)
    static final String SCRIPT = """
        -- TODO Lua : incrémenter le compteur KEYS[1] et garder la valeur
        --            dans une variable locale "compteur"
        -- Indice : redis.call('NOM_COMMANDE', KEYS[1])

        -- TODO Lua : si c'est la 1re requête (compteur == 1),
        --            poser une expiration de ARGV[2] secondes sur la clé

        if compteur > tonumber(ARGV[1]) then
          return 0
        end
        return 1
        """;

    public static Long autoriser(Jedis jedis, String utilisateur, int limite, int fenetre) {
        String cle = "limite:" + utilisateur;
        // TODO Redis : exécuter SCRIPT avec la clé "cle" et les arguments
        //              limite et fenetre (convertis en String)
        // Indice : jedis.eval(script, listeDesCles, listeDesArguments) ; le résultat est un Long
        return null;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            jedis.del("limite:alice");

            List<Long> resultats = new ArrayList<>();
            for (int i = 1; i <= 12; i++) resultats.add(autoriser(jedis, "alice", 10, 60));
            System.out.println("Réponses : " + resultats);

            long ok = resultats.stream().filter(r -> r != null && r == 1).count();
            long refus = resultats.stream().filter(r -> r != null && r == 0).count();
            Lab.verifier("10 requêtes autorisées", ok == 10,
                resultats.get(0) == null ? "autoriser() renvoie null : le script est-il exécuté ?" : ok + " requêtes autorisées.");
            Lab.verifier("2 requêtes refusées", refus == 2, refus + " requêtes refusées.");
            long ttl = jedis.ttl("limite:alice");
            Lab.verifier("La clé expire bien (TTL = " + ttl + " s)", ttl > 0 && ttl <= 60,
                ttl == -1 ? "La clé n'a pas d'expiration : relisez le 2e TODO Lua." : "La clé n'existe pas.");
        }
    }
}
