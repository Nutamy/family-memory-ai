import "server-only";
import { cloudflareEnv } from "../cloudflare";
import { LocalStorageDriver } from "./local";
import { R2StorageDriver } from "./r2";
import { S3StorageDriver } from "./s3";
import type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!driver) {
    // On Workers the R2 binding wins: there is no persistent local disk there.
    const kind = process.env.STORAGE_DRIVER || (cloudflareEnv()?.BUCKET ? "r2" : "local");
    driver = kind === "r2" ? new R2StorageDriver() : kind === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  }
  return driver;
}

export type { StorageBody, StorageDriver } from "./types";
