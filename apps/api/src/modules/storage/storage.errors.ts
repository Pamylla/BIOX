/** Missing/invalid storage env — a server misconfiguration, never a client error. */
export class StorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigError";
  }
}

/** A key that could escape the storage root or breaks portability across drivers. */
export class InvalidStorageKeyError extends Error {
  constructor(key: string) {
    super(`Invalid storage key: "${key}"`);
    this.name = "InvalidStorageKeyError";
  }
}

/** get() on a key that has no object behind it. */
export class StorageObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Storage object not found: "${key}"`);
    this.name = "StorageObjectNotFoundError";
  }
}
