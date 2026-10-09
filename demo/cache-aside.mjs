export async function cacheAside(key, ttlMs, fetcher) {
  try {
    const cached = await client.get(key);
    if (cached !== null)
      return JSON.parse(cached);
  } catch (err) {
    // Redis indisponible → continuer sans cache
    console.warn('Cache read failed:', err.message);
  }

  const data = await fetcher(); // appel DB/API

  try {
    // Jitter : ± 10% sur le TTL
    const jitter = Math.random() * 0.2 - 0.1;
    const finalTtl = Math.floor(ttlMs * (1 + jitter));
    await client.set(key, JSON.stringify(data),
      { PX: finalTtl });
  } catch (err) {
    console.warn('Cache write failed:', err.message);
  }
  return data;
}
