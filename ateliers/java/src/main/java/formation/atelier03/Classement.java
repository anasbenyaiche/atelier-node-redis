// ─────────────────────────────────────────────────────────────
// Atelier 3B — Classement de joueurs avec un SORTED SET
// Lancer : mvn -q compile exec:java -Datelier=atelier03.Classement
//
// Le classement est un sorted set "classement:jeu" :
//   membre = nom du joueur, score = points.
// Complétez uniquement les blocs "TODO Redis".
// ─────────────────────────────────────────────────────────────
package formation.atelier03;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.resps.Tuple;

import java.util.List;

public class Classement {

    static final String CLE = "classement:jeu";

    public static void ajouterJoueur(Jedis jedis, String nom, double points) {
        // TODO Redis : ajouter le joueur avec son score dans le sorted set
        // Indice : commande Z… (clé, score, membre)
    }

    public static double ajouterPoints(Jedis jedis, String nom, double points) {
        // TODO Redis : ajouter des points au score actuel du joueur
        return 0;
    }

    public static List<Tuple> top(Jedis jedis, int n) {
        // TODO Redis : renvoyer les n meilleurs joueurs AVEC leur score,
        //              du plus grand au plus petit
        // Indice : une variante « REV » de ZRANGE, version …WithScores
        return null;
    }

    public static Long rang(Jedis jedis, String nom) {
        // TODO Redis : renvoyer la position du joueur (1 = premier)
        // Indice : Redis compte à partir de 0 et il faut l'ordre décroissant
        return null;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            jedis.del(CLE);

            ajouterJoueur(jedis, "alice", 120);
            ajouterJoueur(jedis, "bob", 90);
            ajouterJoueur(jedis, "chloe", 150);
            ajouterJoueur(jedis, "david", 60);
            ajouterPoints(jedis, "bob", 100); // bob passe à 190

            List<Tuple> podium = top(jedis, 3);
            System.out.println("Top 3 : " + podium);

            long nb = jedis.zcard(CLE);
            Double bob = jedis.zscore(CLE, "bob");
            Long rangChloe = rang(jedis, "chloe");

            Lab.verifier("ajouterJoueur : 4 joueurs dans le classement", nb == 4, "Nombre de joueurs : " + nb + ".");
            Lab.verifier("ajouterPoints : bob a 190 points", bob != null && bob == 190,
                bob == null ? "bob n'est pas dans le classement."
                    : bob == 90 ? "Les points n'ont pas été ajoutés."
                    : bob == 100 ? "Le score a été remplacé au lieu d'être augmenté." : "Score de bob : " + bob + ".");
            Lab.verifier("top : bob en premier, 3 joueurs",
                podium != null && podium.size() == 3 && "bob".equals(podium.get(0).getElement()),
                podium == null ? "La méthode renvoie null."
                    : !podium.isEmpty() && "david".equals(podium.get(0).getElement()) ? "L'ordre est inversé : il faut du plus grand au plus petit."
                    : "Vérifiez les bornes (0 à n-1).");
            Lab.verifier("rang : chloe est 2e", rangChloe != null && rangChloe == 2,
                rangChloe == null ? "La méthode renvoie null."
                    : rangChloe == 1 ? "Redis compte à partir de 0 : il faut ajouter 1."
                    : rangChloe == 3 ? "Il faut le rang en ordre décroissant." : "Rang obtenu : " + rangChloe + ".");
        }
    }
}
