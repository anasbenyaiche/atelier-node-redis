import { createClient } from "redis";

// RediSearch n'existe pas dans redis:7-alpine : on utilise redis-stack (port 6380)
// docker compose up -d redis-stack
export async function getClient() {
  const client = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6380",
  });
  client.on("error", (err) => console.error("Redis error", err));
  await client.connect();
  return client;
}

// Supprime l'index s'il existe déjà (pour pouvoir relancer les exemples)
export async function dropIndexIfExists(client, index) {
  try {
    await client.ft.dropIndex(index);
  } catch {
    // l'index n'existe pas encore
  }
}
