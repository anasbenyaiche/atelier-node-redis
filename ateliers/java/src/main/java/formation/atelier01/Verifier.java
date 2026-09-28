// ─────────────────────────────────────────────────────────────
// Atelier 1 — Vérificateur (atelier en console)
// Lancer        : mvn -q compile exec:java -Datelier=atelier01.Verifier
// Remise à zéro : mvn -q compile exec:java -Datelier=atelier01.Verifier -Dexec.args=--reset
// Ce programme ne fait que LIRE l'état de Redis après vos commandes.
// ─────────────────────────────────────────────────────────────
package formation.atelier01;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.util.Arrays;

public class Verifier {

    static final String[] CLES = {
        "formation:nom", "formation:participants", "promo:code", "cache:page",
        "session:temp", "user:1", "user:2", "user:3", "reponse:scan", "reponse:type",
    };

    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter()) {
            if (Arrays.asList(args).contains("--reset")) {
                jedis.del(CLES);
                System.out.println("🧹 Clés de l'atelier 1 supprimées : vous pouvez recommencer.");
                return;
            }

            String nom = jedis.get("formation:nom");
            Lab.verifier("1. formation:nom = 'Redis NoSQL'", "Redis NoSQL".equals(nom),
                nom == null ? "La clé n'existe pas." : "La valeur ne correspond pas (attention aux espaces et aux guillemets).");

            String part = jedis.get("formation:participants");
            Lab.verifier("2. formation:participants = 3", "3".equals(part),
                part == null ? "La clé n'existe pas." : "Valeur actuelle : " + part + ". Repartez de 0 et utilisez une commande d'incrémentation.");

            String promo = jedis.get("promo:code");
            long ttlPromo = jedis.ttl("promo:code");
            Lab.verifier("3a. promo:code = 'REDIS50'", "REDIS50".equals(promo),
                promo == null ? "La clé n'existe pas (ou a déjà expiré)." : null);
            Lab.verifier("3b. promo:code expire dans 5 minutes au plus", ttlPromo > 0 && ttlPromo <= 300,
                ttlPromo == -2 ? "La clé n'existe pas." : ttlPromo == -1 ? "La clé n'a pas d'expiration." : ttlPromo > 300 ? "L'expiration dépasse 5 minutes." : null);

            long ttlCache = jedis.ttl("cache:page");
            Lab.verifier("4. cache:page existe et n'expire plus", ttlCache == -1,
                ttlCache == -2 ? "La clé n'existe pas (a-t-elle expiré avant l'annulation ?)." : "La clé a encore une expiration.");

            Lab.verifier("5. session:temp a été supprimée", !jedis.exists("session:temp"), "La clé existe encore.");

            Lab.verifier("6. user:1, user:2 et user:3 existent", jedis.exists("user:1", "user:2", "user:3") == 3,
                "Il manque au moins une des trois clés.");

            // Réponse attendue : calculée avec SCAN plutôt qu'écrite en dur
            long nbUser = 0;
            String curseur = ScanParams.SCAN_POINTER_START;
            ScanParams params = new ScanParams().match("user:*").count(100);
            do {
                ScanResult<String> page = jedis.scan(curseur, params);
                nbUser += page.getResult().size();
                curseur = page.getCursor();
            } while (!curseur.equals(ScanParams.SCAN_POINTER_START));
            String repScan = jedis.get("reponse:scan");
            Lab.verifier("7. reponse:scan contient le bon nombre", repScan != null && repScan.trim().equals(String.valueOf(nbUser)),
                repScan == null ? "La clé reponse:scan n'existe pas." : "Mauvaise réponse : parcourez les clés avec SCAN et un motif (MATCH).");

            String repType = jedis.get("reponse:type");
            String typeReel = jedis.type("promo:code");
            Lab.verifier("8. reponse:type contient le bon type", repType != null && repType.trim().equalsIgnoreCase(typeReel),
                repType == null ? "La clé reponse:type n'existe pas." : "Mauvaise réponse : une commande Redis donne le type d'une clé.");
        }
    }
}
