import { createClient } from "redis";
import LeaderBoard from "./stucture/leader-board.mjs";
import { transfer } from "./transaction/transaction.mjs";

const client = createClient({
  url: "redis://localhost:6379",

});

client.on("error", (err) => console.error("Redis error:", err));

await client.connect(() => console.log("Redis connected"));

client.quit();
