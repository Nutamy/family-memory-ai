import type { R2Bucket } from "@cloudflare/workers-types";
import { cloudflareEnv } from "../cloudflare";
import type { StorageBody, StorageDriver } from "./types";

/** Cloudflare R2 through the BUCKET binding (wrangler.jsonc). The bucket stays private. */
export class R2StorageDriver implements StorageDriver {
  private bucket(): R2Bucket {
    const b = cloudflareEnv()?.BUCKET;
    if (!b) throw new Error("R2 binding BUCKET is not configured");
    return b;
  }

  async put(key: string, data: StorageBody, contentType: string) {
    // workers-types and DOM Blob types differ only nominally.
    await this.bucket().put(key, data as unknown as ArrayBuffer, { httpMetadata: { contentType } });
  }

  async get(key: string) {
    const obj = await this.bucket().get(key);
    if (!obj) throw new Error(`Object not found: ${key}`);
    return Buffer.from(await obj.arrayBuffer());
  }

  async getRange(key: string, offset: number, length: number) {
    const obj = await this.bucket().get(key, { range: { offset, length } });
    if (!obj) throw new Error(`Object not found: ${key}`);
    return Buffer.from(await obj.arrayBuffer());
  }

  async size(key: string) {
    return (await this.bucket().head(key))?.size ?? null;
  }

  async delete(key: string) {
    await this.bucket().delete(key);
  }

  async exists(key: string) {
    return (await this.size(key)) !== null;
  }
}
