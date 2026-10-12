/** Blob/File bodies are passed through as-is so R2 can store uploads without an extra in-memory copy. */
export type StorageBody = Uint8Array | Blob;

export interface StorageDriver {
  put(key: string, data: StorageBody, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  /** Byte range read — lets large files be streamed or split without loading them whole. */
  getRange(key: string, offset: number, length: number): Promise<Buffer>;
  /** Size in bytes, or null when the object does not exist. */
  size(key: string): Promise<number | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
