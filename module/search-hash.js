import { SCHEMA_FIELD_TYPE } from "redis";
import { getClient, dropIndexIfExists } from "./client.js";

const client = await getClient();
const INDEX = "idx:products";

// 1. Créer un index sur tous les HASH dont la clé commence par "product:"
await dropIndexIfExists(client, INDEX);
await client.ft.create(
  INDEX,
  {
    name: { type: SCHEMA_FIELD_TYPE.TEXT, SORTABLE: true },
    description: SCHEMA_FIELD_TYPE.TEXT,
    category: SCHEMA_FIELD_TYPE.TAG,
    price: { type: SCHEMA_FIELD_TYPE.NUMERIC, SORTABLE: true },
  },
  { ON: "HASH", PREFIX: "product:" },
);

// 2. Ajouter des documents (de simples HSET, indexés automatiquement)
const products = [
  { id: 1, name: "Clavier mécanique", description: "Clavier RGB switches rouges", category: "informatique", price: 89 },
  { id: 2, name: "Souris sans fil", description: "Souris ergonomique bluetooth", category: "informatique", price: 35 },
  { id: 3, name: "Casque audio", description: "Casque bluetooth réduction de bruit", category: "audio", price: 199 },
  { id: 4, name: "Enceinte portable", description: "Enceinte bluetooth étanche", category: "audio", price: 59 },
  { id: 5, name: "Écran 27 pouces", description: "Écran 4K pour le travail", category: "informatique", price: 329 },
];
for (const { id, ...fields } of products) {
  await client.hSet(`product:${id}`, fields);
}

const show = (title, res) => {
  console.log(`\n=== ${title} (${res.total} résultat(s))`);
  for (const doc of res.documents) console.log(doc.id, doc.value);
};

// 3. Recherche plein texte
show("Texte: bluetooth", await client.ft.search(INDEX, "bluetooth"));

// 4. Recherche par préfixe
show("Préfixe: clav*", await client.ft.search(INDEX, "clav*"));

// 5. Filtre par TAG
show("Tag: audio", await client.ft.search(INDEX, "@category:{audio}"));

// 6. Plage numérique + tri + champs retournés
show(
  "Prix entre 30 et 100, triés par prix",
  await client.ft.search(INDEX, "@price:[30 100]", {
    SORTBY: { BY: "price", DIRECTION: "ASC" },
    RETURN: ["name", "price"],
  }),
);

// 7. Combinaison : texte ET tag ET prix
show(
  "bluetooth + informatique + prix < 50",
  await client.ft.search(INDEX, "bluetooth @category:{informatique} @price:[-inf 50]"),
);

// 8. Pagination
show(
  "Tous les produits, page 1 (2 par page)",
  await client.ft.search(INDEX, "*", { LIMIT: { from: 0, size: 2 } }),
);

await client.quit();
