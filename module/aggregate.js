import { FT_AGGREGATE_STEPS, FT_AGGREGATE_GROUP_BY_REDUCERS } from "redis";
import { getClient } from "./client.js";

// Utilise l'index "idx:products" créé par search-hash.js (le lancer d'abord)
const client = await getClient();

// Équivalent SQL :
// SELECT category, COUNT(*) AS count, AVG(price) AS avg_price
// FROM products GROUP BY category ORDER BY count DESC
const res = await client.ft.aggregate("idx:products", "*", {
  LOAD: ["@category", "@price"],
  STEPS: [
    {
      type: FT_AGGREGATE_STEPS.GROUPBY,
      properties: "@category",
      REDUCE: [
        { type: FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT, AS: "count" },
        { type: FT_AGGREGATE_GROUP_BY_REDUCERS.AVG, property: "@price", AS: "avg_price" },
      ],
    },
    {
      type: FT_AGGREGATE_STEPS.SORTBY,
      BY: { BY: "@count", DIRECTION: "DESC" },
    },
  ],
});

console.table(res.results);

await client.quit();
