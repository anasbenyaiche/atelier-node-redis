package formation.lab;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisAccessControlException;
import redis.clients.jedis.exceptions.JedisConnectionException;

import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;

/** Connexion et auto-vérification partagées par tous les ateliers — rien à compléter ici. */
public final class Lab {

    private Lab() {}

    // Force l'UTF-8 pour afficher correctement ✅ ❌ 💡 et les accents
    // (utile sous Windows, où la console n'est pas toujours en UTF-8)
    static {
        System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, StandardCharsets.UTF_8));
        System.setErr(new PrintStream(new FileOutputStream(FileDescriptor.err), true, StandardCharsets.UTF_8));
    }

    public static Jedis connecter() {
        String url = System.getenv().getOrDefault("REDIS_URL", "redis://localhost:6379");
        Jedis jedis = null;
        try {
            jedis = new Jedis(URI.create(url), 3000);
            jedis.ping();
        } catch (JedisConnectionException e) {
            System.err.println("❌ Impossible de se connecter à Redis sur " + url);
            System.err.println("   → Le lab est-il démarré ?  docker compose up -d");
            System.err.println("   → Vérifiez avec :          docker ps   (le conteneur redis-lab doit être Up)");
            System.exit(1);
        } catch (JedisAccessControlException e) {
            System.err.println("❌ Redis refuse la connexion : " + e.getMessage());
            System.err.println("   → Ce Redis demande un mot de passe. Passez-le dans l'URL :");
            System.err.println("     REDIS_URL=redis://default:<motdepasse>@localhost:<port>   (ou redis://<utilisateur>:<motdepasse>@…)");
            System.exit(1);
        }
        return jedis;
    }

    /** Affiche ✅ ou ❌ (et un indice 💡 facultatif en cas d'échec). */
    public static boolean verifier(String libelle, boolean condition, String indice) {
        System.out.println((condition ? "✅ " : "❌ ") + libelle);
        if (!condition && indice != null && !indice.isBlank()) System.out.println("   💡 " + indice);
        return condition;
    }

    public static boolean verifier(String libelle, boolean condition) {
        return verifier(libelle, condition, null);
    }
}
