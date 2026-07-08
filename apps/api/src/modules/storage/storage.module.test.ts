import { describe, expect, it } from "vitest";
import { LocalDiskStorage } from "./local-disk.storage";
import { S3Storage } from "./s3.storage";
import { StorageConfigError } from "./storage.errors";
import { createStorageAdapter } from "./storage.module";

const S3_ENV = {
  STORAGE_DRIVER: "s3",
  S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  S3_BUCKET: "biox-reports",
  S3_ACCESS_KEY_ID: "key-id",
  S3_SECRET_ACCESS_KEY: "secret",
};

describe("createStorageAdapter", () => {
  it("defaults to local disk when STORAGE_DRIVER is unset", () => {
    expect(createStorageAdapter({})).toBeInstanceOf(LocalDiskStorage);
  });

  it("treats a blank STORAGE_DRIVER as unset (defaults to local, not a crash)", () => {
    expect(createStorageAdapter({ STORAGE_DRIVER: "" })).toBeInstanceOf(LocalDiskStorage);
  });

  it("treats a blank S3 var as missing", () => {
    expect(() => createStorageAdapter({ ...S3_ENV, S3_BUCKET: "" })).toThrow(/S3_BUCKET/);
  });

  it("builds the S3 driver when its env is complete", () => {
    expect(createStorageAdapter(S3_ENV)).toBeInstanceOf(S3Storage);
  });

  it("names every missing S3 variable", () => {
    expect(() =>
      createStorageAdapter({ STORAGE_DRIVER: "s3", S3_ENDPOINT: S3_ENV.S3_ENDPOINT }),
    ).toThrow(/S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/);
  });

  it("rejects unknown drivers", () => {
    expect(() => createStorageAdapter({ STORAGE_DRIVER: "gcs" })).toThrow(StorageConfigError);
  });
});
