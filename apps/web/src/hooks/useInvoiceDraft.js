import { openDB } from 'idb';

const DB_NAME = 'invoicer';
const STORE = 'drafts';
const KEY = 'current';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    }
  });
}

export async function saveDraft(fields) {
  const db = await getDB();
  await db.put(STORE, fields, KEY);
}

export async function loadDraft() {
  const db = await getDB();
  return db.get(STORE, KEY);
}
