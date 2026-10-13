import { appConfig } from "@/shared/config";
import type { EncryptedRecord } from "./tokenStore.types";
import type { Origin } from "@/shared/lib/communityServer";

/*
Refresh token storage: IndexedDB + encryption using a non-extractable key.

Why not cookies: the client makes cross-domain requests to community servers,
meaning the cookies are third-party. Safari and Firefox block these by default,
causing login sessions to fail for some users.

Why not localStorage: it can be read by any single line of script,
exposing the token along with its remaining lifespan.

What encryption provides: the key is created with `extractable: false`,
so its raw bytes cannot be accessed from JS by any means. Only the ciphertext
remains on disk—making a copied browser profile, an IndexedDB file dump,
or a backup useless to an attacker.
*/

const DB_NAME = `${appConfig.appName}-auth`;
const DB_VERSION = 1;

const ENCRYPTION_ALGORITHM_NAME = "AES-GCM";

const KEYS_STORE = "keys";
const TOKENS_STORE = "tokens";

const WRAP_KEY_ID = "wrap";

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((res, rej) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEYS_STORE)) db.createObjectStore(KEYS_STORE);
      if (!db.objectStoreNames.contains(TOKENS_STORE)) db.createObjectStore(TOKENS_STORE);
    };
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
  });

  return dbPromise;
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  return promisify(body(tx.objectStore(storeName)));
}

async function getWrapkey(): Promise<CryptoKey> {
  const existing = await withStore(KEYS_STORE, "readonly", (s) => s.get(WRAP_KEY_ID));

  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: ENCRYPTION_ALGORITHM_NAME, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await withStore(KEYS_STORE, "readwrite", (s) => s.put(key, WRAP_KEY_ID));

  return key;
}

async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch (e) {
    return false;
  }
}

async function saveRefreshToken(origin: Origin, refreshToken: string): Promise<void> {
  const key = await getWrapkey();

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherText = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM_NAME, iv },
    key,
    new TextEncoder().encode(refreshToken),
  );
  const record: EncryptedRecord = { iv, cipherText };

  await withStore(TOKENS_STORE, "readwrite", (s) => s.put(record, origin));
}

async function loadRefreshToken(origin: Origin): Promise<string | null> {
  const record = await withStore<EncryptedRecord | undefined>(TOKENS_STORE, "readonly", (s) =>
    s.get(origin),
  );

  if (!record) return null;

  try {
    const key = await getWrapkey();
    const plainText = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM_NAME, iv: record.iv },
      key,
      record.cipherText,
    );

    return new TextDecoder().decode(plainText);
  } catch {
    await deleteRefreshToken(origin);
    return null;
  }
}

function deleteRefreshToken(origin: Origin): Promise<void> {
  return withStore(TOKENS_STORE, "readwrite", (s) => s.delete(origin));
}

async function listKnownOrigins(): Promise<Origin[]> {
  const keys = await withStore(TOKENS_STORE, "readonly", (s) => s.getAllKeys());
  return keys.filter((key): key is Origin => typeof key === "string");
}

export {
  deleteRefreshToken,
  listKnownOrigins,
  loadRefreshToken,
  saveRefreshToken,
  requestPersistentStorage,
};
