import { SCHEMA_FIELD_TYPE } from "redis";
import { getClient, dropIndexIfExists } from "./client.js";

const client = await getClient();
const INDEX = "idx:users";

// Index sur des documents JSON (module RedisJSON) : on indexe via des JSONPath
await dropIndexIfExists(client, INDEX);
await client.ft.create(
  INDEX,
  {
    "$.name": { type: SCHEMA_FIELD_TYPE.TEXT, AS: "name" },
    "$.city": { type: SCHEMA_FIELD_TYPE.TAG, AS: "city" },
    "$.age": { type: SCHEMA_FIELD_TYPE.NUMERIC, AS: "age" },
    "$.skills[*]": { type: SCHEMA_FIELD_TYPE.TAG, AS: "skills" },
  },
  { ON: "JSON", PREFIX: "user:" },
);

await client.json.set("user:1", "$", { name: "Anas Ben", city: "Paris", age: 30, skills: ["node", "redis"] });
await client.json.set("user:2", "$", { name: "Sarah Dupont", city: "Paris", age: 25, skills: ["react", "node"] });
await client.json.set("user:3", "$", { name: "Theo ", city: "Madrid", age: 41, skills: ["java", "redis"] });

const show = (title, res) => {
  console.log(`\n=== ${title} (${res.total} résultat(s))`);
  for (const doc of res.documents) console.log(doc.id, doc.value);
};

show("Habitants de Paris", await client.ft.search(INDEX, "@city:{Tunis}"));
show("Compétence redis", await client.ft.search(INDEX, "@skills:{redis}"));
show("Âge >= 30", await client.ft.search(INDEX, "@age:[30 +inf]"));
show("Nom: sara", await client.ft.search(INDEX, "@name:sarah"));

await client.quit();
