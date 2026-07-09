import { Module } from "@nestjs/common";
import PgBoss from "pg-boss";
import { readEnv } from "../../common/env";
import { JobQueuePort } from "./job-queue.port";
import { JobsConfigError } from "./jobs.errors";
import { PgBossJobQueue } from "./pg-boss.queue";

/** Pure so configuration is testable without touching process.env. */
export function createJobQueue(env: NodeJS.ProcessEnv): PgBossJobQueue {
  const databaseUrl = readEnv(env, "DATABASE_URL");
  if (!databaseUrl) {
    throw new JobsConfigError("DATABASE_URL is required — pg-boss stores jobs in Postgres");
  }
  return new PgBossJobQueue(new PgBoss(databaseUrl));
}

/** Binds JobQueuePort to pg-boss. Consumers inject JobQueuePort, never the impl. */
@Module({
  providers: [{ provide: JobQueuePort, useFactory: () => createJobQueue(process.env) }],
  exports: [JobQueuePort],
})
export class JobsModule {}
