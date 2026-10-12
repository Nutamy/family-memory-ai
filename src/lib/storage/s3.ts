import type { StorageDriver } from "./types";

// Placeholder for S3-compatible storage (AWS S3, Yandex Object Storage, MinIO, R2).
// Implement with @aws-sdk/client-s3: PutObject / GetObject / DeleteObject / HeadObject
// using S3_BUCKET, S3_REGION, S3_ENDPOINT and credentials from env. Keys are the same
// relative paths the local driver uses, so existing records migrate by copying files.
export class S3StorageDriver implements StorageDriver {
  private fail(): never {
    throw new Error("S3 storage driver is not implemented yet — set STORAGE_DRIVER=local");
  }
  async put() {
    this.fail();
  }
  async get(): Promise<Buffer> {
    this.fail();
  }
  async delete() {
    this.fail();
  }
  async exists(): Promise<boolean> {
    this.fail();
  }
}
