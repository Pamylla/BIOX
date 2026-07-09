import { beforeEach, describe, expect, it, vi } from "vitest";
import type PgBoss from "pg-boss";
import { JOB_NAMES } from "./job-queue.port";
import { PgBossJobQueue } from "./pg-boss.queue";

describe("PgBossJobQueue", () => {
  const boss = {
    on: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    createQueue: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue("job-id"),
  };
  const queue = new PgBossJobQueue(boss as unknown as PgBoss);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts pg-boss and creates every known queue on init", async () => {
    await queue.onModuleInit();

    expect(boss.start).toHaveBeenCalledOnce();
    for (const name of JOB_NAMES) {
      expect(boss.createQueue).toHaveBeenCalledWith(name);
    }
  });

  it("registers an error listener so maintenance failures never crash the process", async () => {
    await queue.onModuleInit();

    expect(boss.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("delegates publish to pg-boss send", async () => {
    await queue.publish("extraction.run", { extractionId: "ext-1" });

    expect(boss.send).toHaveBeenCalledWith("extraction.run", { extractionId: "ext-1" });
  });

  it("stops pg-boss on shutdown", async () => {
    await queue.onApplicationShutdown();

    expect(boss.stop).toHaveBeenCalledOnce();
  });
});
