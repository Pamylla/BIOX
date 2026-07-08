import { InvalidStorageKeyError } from "./storage.errors";

/**
 * Blob storage behind the ingestion pipeline (plan D5): PDFs go in at upload,
 * come out for the extraction worker, and are erased by the LGPD purge.
 * Abstract class (not interface) so it doubles as the Nest injection token —
 * StorageModule binds it to local disk or S3/R2 by STORAGE_DRIVER.
 */
export abstract class StoragePort {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Rejects with StorageObjectNotFoundError when the key has no object. */
  abstract get(key: string): Promise<Buffer>;

  /** Idempotent: deleting a missing key resolves — the purge job can retry safely. */
  abstract delete(key: string): Promise<void>;
}

const KEY_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

/**
 * Every adapter validates keys the same way so objects written by one driver
 * are addressable by another: relative slash-separated paths of safe segments.
 * On disk this is also the path-traversal guard (no "..", no absolute paths).
 */
export function assertValidStorageKey(key: string): void {
  const segments = key.split("/");
  const valid = segments.length > 0 && segments.every((segment) => KEY_SEGMENT.test(segment));
  if (!valid) throw new InvalidStorageKeyError(key);
}
