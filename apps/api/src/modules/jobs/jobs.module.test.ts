import { describe, expect, it } from "vitest";
import { createJobQueue } from "./jobs.module";
import { JobsConfigError } from "./jobs.errors";
import { PgBossJobQueue } from "./pg-boss.queue";

describe("createJobQueue", () => {
  it("builds a pg-boss queue from DATABASE_URL", () => {
    const queue = createJobQueue({ DATABASE_URL: "postgresql://biox:biox@localhost:5432/biox" });

    expect(queue).toBeInstanceOf(PgBossJobQueue);
  });

  it("rejects a missing or blank DATABASE_URL", () => {
    expect(() => createJobQueue({})).toThrow(JobsConfigError);
    expect(() => createJobQueue({ DATABASE_URL: "  " })).toThrow(JobsConfigError);
  });
});
