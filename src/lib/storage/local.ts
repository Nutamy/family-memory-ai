import { promises as fs } from "fs";
import path from "path";
import type { StorageBody, StorageDriver } from "./types";

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

  async put(key: string, data: StorageBody) {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data);
  }

  async get(key: string) {
    return fs.readFile(this.resolve(key));
  }

  async getRange(key: string, offset: number, length: number) {
    const fh = await fs.open(this.resolve(key), "r");
    try {
      const buf = Buffer.alloc(length);
      const { bytesRead } = await fh.read(buf, 0, length, offset);
      return buf.subarray(0, bytesRead);
    } finally {
      await fh.close();
    }
  }

  async size(key: string) {
    try {
      return (await fs.stat(this.resolve(key))).size;
    } catch {
      return null;
    }
  }

  async delete(key: string) {
    await fs.rm(this.resolve(key), { force: true });
  }

  async exists(key: string) {
    return (await this.size(key)) !== null;
  }
}
