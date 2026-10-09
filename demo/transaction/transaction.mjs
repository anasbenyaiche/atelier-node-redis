export async function transfer(from, to, value, client) {
  const balance = Number(await client.get(from));
  if (balance < value) {
    throw Error("Les fonds sont insuffisant");
  }

  const [fromBalance, toBalance] = await client
    .multi()
    .decrBy(from, value)
    .incrBy(to, value)
    .exec();

  return { fromBalance, toBalance };
}

// ajouter les from et to
async function createUserBalances() {
  await client.mSet({ "max:checkings": "100", "hugo:checkings": "100" });
  // verifier les comptes
  const max = await client.get("max:checkings");
  console.log("Compte de Max  " + max + "$");
  const hugo = await client.get("hugo:checkings");
  console.log("Compte de hugo  " + hugo + "$");
  try {
    const balance = await transfer(
      "max:checkings",
      "hugo:checkings",
      40,
      client,
    );
    console.log("Transfer de 40 $  de Max vers Hugo");
    console.log(`solde Max : ${balance.fromBalance} $`);
    console.log(`solde Hugo : ${balance.toBalance} $`);
  } catch (error) {
    console.error(error.message);
  }
}
