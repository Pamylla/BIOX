import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { S3Storage } from "./s3.storage";
import { InvalidStorageKeyError, StorageObjectNotFoundError } from "./storage.errors";

const CONFIG = {
  endpoint: "https://account.r2.cloudflarestorage.com",
  bucket: "biox-reports",
  accessKeyId: "key-id",
  secretAccessKey: "secret",
};

describe("S3Storage", () => {
  const send = vi.fn();
  const storage = new S3Storage(CONFIG, { send } as unknown as S3Client);

  beforeEach(() => {
    send.mockReset();
  });

  it("puts with bucket, key, body and content type", async () => {
    const body = Buffer.from("pdf bytes");

    await storage.put("reports/laudo.pdf", body, "application/pdf");

    const command = send.mock.calls[0]?.[0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: "biox-reports",
      Key: "reports/laudo.pdf",
      Body: body,
      ContentType: "application/pdf",
    });
  });

  it("gets an object back as a Buffer", async () => {
    send.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    });

    const result = await storage.get("reports/laudo.pdf");

    const command = send.mock.calls[0]?.[0] as GetObjectCommand;
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({ Bucket: "biox-reports", Key: "reports/laudo.pdf" });
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it("maps NoSuchKey to StorageObjectNotFoundError", async () => {
    const noSuchKey = new Error("no such key");
    noSuchKey.name = "NoSuchKey";
    send.mockRejectedValue(noSuchKey);

    await expect(storage.get("reports/missing.pdf")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("deletes by bucket and key", async () => {
    await storage.delete("reports/laudo.pdf");

    const command = send.mock.calls[0]?.[0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: "biox-reports", Key: "reports/laudo.pdf" });
  });

  it("validates keys before calling the client", async () => {
    await expect(storage.get("../escape.pdf")).rejects.toBeInstanceOf(InvalidStorageKeyError);
    expect(send).not.toHaveBeenCalled();
  });
});
