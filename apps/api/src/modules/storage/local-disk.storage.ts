import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { StorageObjectNotFoundError } from "./storage.errors";
import { assertValidStorageKey, StoragePort } from "./storage.port";

/** Dev driver (STORAGE_DRIVER=local): objects are plain files under rootDir. */
export class LocalDiskStorage extends StoragePort {
  constructor(private readonly rootDir: string) {
    super();
  }

  // Keeps the port's 3-arg shape; plain files carry no metadata, so contentType is unused.
  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await readFile(this.pathFor(key));
    } catch (error) {
      if (isNoEntry(error)) throw new StorageObjectNotFoundError(key);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  private pathFor(key: string): string {
    assertValidStorageKey(key);
    return join(this.rootDir, key);
  }
}

function isNoEntry(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === "ENOENT";
}
