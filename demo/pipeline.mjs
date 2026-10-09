// Promise.all est déjà pipeliné par node-redis !
const [user, prefs, cart] = await Promise.all([
  client.get('user:42'),
  client.hGetAll('prefs:42'),
  client.lRange('cart:42', 0, -1)
]);

// Pipeline explicite si nécessaire
const pipeline = client.multi();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();
