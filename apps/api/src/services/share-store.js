const crypto = require('crypto');

const TTL_SECONDS = 30 * 24 * 60 * 60;
const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const ID_LENGTH = 8;
const ID_PATTERN = new RegExp(`^[${ALPHABET}]{${ID_LENGTH}}$`);

function newId() {
  const bytes = crypto.randomBytes(ID_LENGTH);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

function redisStore() {
  const { Redis } = require('@upstash/redis');
  const redis = Redis.fromEnv();
  return {
    save: (id, invoice) => redis.set(`share:${id}`, invoice, { ex: TTL_SECONDS, nx: true }),
    load: (id) => redis.get(`share:${id}`),
  };
}

function memoryStore() {
  console.warn('[share] UPSTASH_REDIS_REST_URL is not set; shared links live in memory and vanish on restart.');
  const entries = new Map();
  return {
    save: async (id, invoice) => {
      if (entries.has(id)) return null;
      entries.set(id, { invoice, expires: Date.now() + TTL_SECONDS * 1000 });
      return 'OK';
    },
    load: async (id) => {
      const entry = entries.get(id);
      if (!entry || entry.expires < Date.now()) return null;
      return entry.invoice;
    },
  };
}

const store = process.env.UPSTASH_REDIS_REST_URL ? redisStore() : memoryStore();

async function saveShared(invoice) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newId();
    if ((await store.save(id, invoice)) === 'OK') return { id, expiresAt: new Date(Date.now() + TTL_SECONDS * 1000).toISOString() };
  }
  throw new Error('Could not create a unique link');
}

async function loadShared(id) {
  if (!ID_PATTERN.test(id)) return null;
  return store.load(id);
}

module.exports = { saveShared, loadShared };
