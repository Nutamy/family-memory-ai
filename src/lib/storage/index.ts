import "server-only";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";
import type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!driver) driver = process.env.STORAGE_DRIVER === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  return driver;
}

export type { StorageDriver };
