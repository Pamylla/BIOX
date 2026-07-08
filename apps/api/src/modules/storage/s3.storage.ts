import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { StorageObjectNotFoundError } from "./storage.errors";
import { assertValidStorageKey, StoragePort } from "./storage.port";

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Prod driver (STORAGE_DRIVER=s3): any S3-compatible bucket — Cloudflare R2
 * in the plan (D5). R2 ignores region ("auto") and, like most S3-compatible
 * endpoints, wants path-style addressing.
 */
export class S3Storage extends StoragePort {
  private readonly client: S3Client;

  constructor(
    private readonly config: S3StorageConfig,
    client?: S3Client,
  ) {
    super();
    this.client =
      client ??
      new S3Client({
        endpoint: config.endpoint,
        region: "auto",
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    assertValidStorageKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    assertValidStorageKey(key);
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      if (!response.Body) throw new StorageObjectNotFoundError(key);
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      if (isNoSuchKey(error)) throw new StorageObjectNotFoundError(key);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    assertValidStorageKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }
}

/** GetObject on a missing key surfaces as NoSuchKey (or NotFound on some endpoints). */
function isNoSuchKey(error: unknown): boolean {
  const name = (error as Error | null)?.name;
  return name === "NoSuchKey" || name === "NotFound";
}
