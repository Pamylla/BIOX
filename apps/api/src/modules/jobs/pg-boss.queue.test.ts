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
    work: vi.fn().mockResolvedValue("worker-id"),
  };
  let queue: PgBossJobQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    queue = new PgBossJobQueue(boss as unknown as PgBoss);
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

  it("defers a pre-startup subscription until init, then registers the worker", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    queue.subscribe("extraction.run", handler);
    expect(boss.work).not.toHaveBeenCalled();

    await queue.onModuleInit();
    expect(boss.work).toHaveBeenCalledWith("extraction.run", expect.any(Function));
  });

  it("registers immediately when subscribing after startup", async () => {
    await queue.onModuleInit();

    queue.subscribe("extraction.run", vi.fn().mockResolvedValue(undefined));

    expect(boss.work).toHaveBeenCalledWith("extraction.run", expect.any(Function));
  });

  it("unwraps the pg-boss job batch and hands each payload to the handler", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.subscribe("extraction.run", handler);
    await queue.onModuleInit();

    const workHandler = boss.work.mock.calls[0]?.[1] as (
      jobs: Array<{ data: unknown }>,
    ) => Promise<void>;
    await workHandler([{ data: { extractionId: "ext-1" } }, { data: { extractionId: "ext-2" } }]);

    expect(handler).toHaveBeenNthCalledWith(1, { extractionId: "ext-1" });
    expect(handler).toHaveBeenNthCalledWith(2, { extractionId: "ext-2" });
  });
});
