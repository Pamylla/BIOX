import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalDiskStorage } from "./local-disk.storage";
import { InvalidStorageKeyError, StorageObjectNotFoundError } from "./storage.errors";
import { assertValidStorageKey } from "./storage.port";

describe("assertValidStorageKey", () => {
  it.each(["reports/user-1/laudo.pdf", "a/b/c", "file_name-1.PDF"])("accepts %s", (key) => {
    expect(() => assertValidStorageKey(key)).not.toThrow();
  });

  it.each([
    "",
    "/absolute/key",
    "trailing/",
    "a//b",
    "../escape.pdf",
    "reports/../escape.pdf",
    "reports/./x.pdf",
    "reports/.hidden",
    "back\\slash.pdf",
    "with space.pdf",
    "c:/windows/path.pdf",
  ])("rejects %s", (key) => {
    expect(() => assertValidStorageKey(key)).toThrow(InvalidStorageKeyError);
  });
});

describe("LocalDiskStorage", () => {
  let rootDir: string;
  let storage: LocalDiskStorage;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "biox-storage-"));
    storage = new LocalDiskStorage(rootDir);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("round-trips a nested key, creating intermediate directories", async () => {
    const body = Buffer.from("pdf bytes");

    await storage.put("reports/user-1/laudo.pdf", body, "application/pdf");

    await expect(storage.get("reports/user-1/laudo.pdf")).resolves.toEqual(body);
  });

  it("rejects get on a missing key with StorageObjectNotFoundError", async () => {
    await expect(storage.get("reports/missing.pdf")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("deletes an object and stays idempotent on the second delete", async () => {
    await storage.put("reports/laudo.pdf", Buffer.from("x"), "application/pdf");

    await storage.delete("reports/laudo.pdf");
    await expect(storage.delete("reports/laudo.pdf")).resolves.toBeUndefined();

    await expect(storage.get("reports/laudo.pdf")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("refuses traversal keys before touching the disk", async () => {
    await expect(
      storage.put("../escape.pdf", Buffer.from("x"), "application/pdf"),
    ).rejects.toBeInstanceOf(InvalidStorageKeyError);

    await expect(readdir(rootDir)).resolves.toEqual([]);
  });
});
