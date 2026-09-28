// ─────────────────────────────────────────────────────────────
// Atelier 6 — Virement bancaire : MULTI/EXEC puis WATCH
// Lancer : mvn -q compile exec:java -Datelier=atelier06.Virement
//
// Les soldes sont des strings : "compte:max" et "compte:hugo".
// Partie 1 : rendre le virement atomique avec MULTI / EXEC.
// Partie 2 : protéger la lecture du solde avec WATCH.
// ─────────────────────────────────────────────────────────────
package formation.atelier06;

import formation.lab.Lab;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Transaction;

import java.util.List;

public class Virement {

    // ── Partie 1 ────────────────────────────────────────────
    public static List<Object> virer(Jedis jedis, String de, String vers, long montant) {
        long solde = Long.parseLong(jedis.get(de));
        if (solde < montant) throw new IllegalStateException("Solde insuffisant");

        // TODO Redis : dans UNE transaction, retirer "montant" du compte "de"
        //              et l'ajouter au compte "vers". Renvoyer le résultat d'exec().
        // Indice : jedis.multi() renvoie une Transaction ; appelez deux commandes …By
        //          sur cette transaction, puis exec()
        return null;
    }

    // ── Partie 2 ────────────────────────────────────────────
    // "pendantLaDecision" simule un autre utilisateur qui agit
    // entre la lecture du solde et l'exécution de la transaction.
    // Doit renvoyer true si le virement est passé, false s'il a été annulé.
    public static boolean virerProtege(Jedis jedis, String de, String vers, long montant, Runnable pendantLaDecision) {
        // TODO Redis : surveiller la clé "de" AVANT de lire le solde

        long solde = Long.parseLong(jedis.get(de));
        pendantLaDecision.run();
        if (solde < montant) throw new IllegalStateException("Solde insuffisant");

        // TODO Redis : même transaction qu'en partie 1.
        //              Avec Jedis, exec() renvoie null si la transaction a été annulée.
        return true;
    }

    // ─── Programme de test (ne pas modifier) ─────────────────
    public static void main(String[] args) {
        try (Jedis jedis = Lab.connecter(); Jedis autreClient = Lab.connecter()) {
            // Partie 1
            jedis.mset("compte:max", "100", "compte:hugo", "100");
            System.out.println("Résultat de la transaction : " + virer(jedis, "compte:max", "compte:hugo", 40));
            Lab.verifier("P1 — Max a 60", "60".equals(jedis.get("compte:max")), "Solde de Max : " + jedis.get("compte:max") + ".");
            Lab.verifier("P1 — Hugo a 140", "140".equals(jedis.get("compte:hugo")), "Solde de Hugo : " + jedis.get("compte:hugo") + ".");

            // Partie 2
            jedis.mset("compte:max", "100", "compte:hugo", "100");
            boolean passe = virerProtege(jedis, "compte:max", "compte:hugo", 40, () -> {
                autreClient.decrBy("compte:max", 80); // retrait concurrent !
                System.out.println("   (un autre client vient de retirer 80 à Max)");
            });
            Lab.verifier("P2 — le virement a été annulé par WATCH", !passe,
                "Le virement est passé alors que le solde avait changé : la clé est-elle surveillée AVANT la lecture ?");
            String max = jedis.get("compte:max"), hugo = jedis.get("compte:hugo");
            Lab.verifier("P2 — soldes intacts : Max 20 (seul le retrait concurrent), Hugo 100",
                !passe && "20".equals(max) && "100".equals(hugo), "Soldes : Max " + max + ", Hugo " + hugo + ".");
        }
    }
}
