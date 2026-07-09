import { Module } from "@nestjs/common";
import { readEnv } from "../../common/env";
import { LocalDiskStorage } from "./local-disk.storage";
import { S3Storage } from "./s3.storage";
import { StorageConfigError } from "./storage.errors";
import { StoragePort } from "./storage.port";

const DEFAULT_LOCAL_DIR = "./uploads"; // gitignored (clinical data never enters the repo)

/** Pure so driver selection is testable without touching process.env. */
export function createStorageAdapter(env: NodeJS.ProcessEnv): StoragePort {
  const driver = readEnv(env, "STORAGE_DRIVER") ?? "local";

  if (driver === "local") {
    return new LocalDiskStorage(readEnv(env, "STORAGE_LOCAL_DIR") ?? DEFAULT_LOCAL_DIR);
  }

  if (driver === "s3") {
    const endpoint = readEnv(env, "S3_ENDPOINT");
    const bucket = readEnv(env, "S3_BUCKET");
    const accessKeyId = readEnv(env, "S3_ACCESS_KEY_ID");
    const secretAccessKey = readEnv(env, "S3_SECRET_ACCESS_KEY");

    const missing = [
      ["S3_ENDPOINT", endpoint],
      ["S3_BUCKET", bucket],
      ["S3_ACCESS_KEY_ID", accessKeyId],
      ["S3_SECRET_ACCESS_KEY", secretAccessKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new StorageConfigError(`STORAGE_DRIVER=s3 requires ${missing.join(", ")}`);
    }
    return new S3Storage({
      endpoint: endpoint!,
      bucket: bucket!,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    });
  }

  throw new StorageConfigError(`Unknown STORAGE_DRIVER "${driver}" — use "local" or "s3"`);
}

/** Binds StoragePort to the configured driver. Consumers inject StoragePort, never an impl. */
@Module({
  providers: [{ provide: StoragePort, useFactory: () => createStorageAdapter(process.env) }],
  exports: [StoragePort],
})
export class StorageModule {}
