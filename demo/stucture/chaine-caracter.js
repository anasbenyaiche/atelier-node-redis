export async function addUser(key, value, client) {
  const result = await client.set(key, value);
  console.log(result);
}
export async function readUser(key, client) {
  const getUser = await client.get(key);
  console.log(getUser);
}
