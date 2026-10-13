// IndexedDB storage for archives kept on the device (no account). Used both by pages (reads)
// and by the service worker (the local API, src/lib/local/api.ts). Rows have the same shape as
// the Prisma models, so report, progress and export code run on them unchanged.
import type { Answer, FavoriteItem, Memory, Person, Tag, TestResult, VoiceRecord } from "@prisma/client";

export type LocalMemory = Memory & { tagIds: string[] };

export interface LocalRows {
  persons: Person;
  answers: Answer;
  voiceRecords: VoiceRecord;
  testResults: TestResult;
  memories: LocalMemory;
  tags: Tag;
  favorites: FavoriteItem;
}

export type RowStore = keyof LocalRows;

const ROW_STORES: RowStore[] = ["persons", "answers", "voiceRecords", "testResults", "memories", "tags", "favorites"];
/** Audio and photos as Blobs, keyed like server storage keys: persons/<id>/audio/<stamp>.wav */
const FILES = "files";

let opening: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  return (opening ??= new Promise((resolve, reject) => {
    const r = indexedDB.open("family-memory", 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const name of ROW_STORES) {
        const store = db.createObjectStore(name, { keyPath: "id" });
        if (name !== "persons") store.createIndex("personId", "personId");
      }
      db.createObjectStore(FILES);
    };
    r.onsuccess = () => {
      // Another tab upgraded the schema: drop this handle so the next call reopens.
      r.result.onversionchange = () => {
        r.result.close();
        opening = null;
      };
      resolve(r.result);
    };
    r.onerror = () => {
      opening = null;
      reject(r.error);
    };
  }));
}

function done<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function store(name: string, mode: IDBTransactionMode) {
  return (await openDb()).transaction(name, mode).objectStore(name);
}

export const localDb = {
  async get<S extends RowStore>(name: S, id: string): Promise<LocalRows[S] | undefined> {
    return done((await store(name, "readonly")).get(id));
  },
  async all<S extends RowStore>(name: S): Promise<LocalRows[S][]> {
    return done((await store(name, "readonly")).getAll());
  },
  async byPerson<S extends Exclude<RowStore, "persons">>(name: S, personId: string): Promise<LocalRows[S][]> {
    return done((await store(name, "readonly")).index("personId").getAll(personId));
  },
  async put<S extends RowStore>(name: S, row: LocalRows[S]) {
    await done((await store(name, "readwrite")).put(row));
  },
  async delete(name: RowStore, id: string) {
    await done((await store(name, "readwrite")).delete(id));
  },
  async deleteByPerson(name: Exclude<RowStore, "persons">, personId: string) {
    const s = await store(name, "readwrite");
    const keys = await done(s.index("personId").getAllKeys(personId));
    await Promise.all(keys.map((k) => done(s.delete(k))));
  },
  async putFile(key: string, blob: Blob) {
    await done((await store(FILES, "readwrite")).put(blob, key));
  },
  async getFile(key: string): Promise<Blob | undefined> {
    return done((await store(FILES, "readonly")).get(key));
  },
  async deleteFile(key: string) {
    await done((await store(FILES, "readwrite")).delete(key));
  },
  async deleteFilesWithPrefix(prefix: string) {
    await done((await store(FILES, "readwrite")).delete(IDBKeyRange.bound(prefix, `${prefix}￿`)));
  },
};

/** Removes a person with all rows and files. */
export async function deleteLocalPerson(personId: string) {
  for (const name of ROW_STORES) {
    if (name !== "persons") await localDb.deleteByPerson(name, personId);
  }
  await localDb.deleteFilesWithPrefix(`persons/${personId}/`);
  await localDb.delete("persons", personId);
}
