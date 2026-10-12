import { promises as fs } from "fs";
import path from "path";
import type { StorageDriver } from "./types";

export class LocalStorageDriver implements StorageDriver {
  private root: string;

  constructor(root = process.env.STORAGE_LOCAL_DIR || "./storage") {
    this.root = path.resolve(process.cwd(), root);
  }

  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    // Prevent path traversal outside the storage root.
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, data: Buffer) {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async get(key: string) {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string) {
    await fs.rm(this.resolve(key), { force: true });
  }

  async exists(key: string) {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
