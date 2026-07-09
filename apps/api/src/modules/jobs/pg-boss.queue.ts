import { Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import type PgBoss from "pg-boss";
import { JOB_NAMES, type JobName, type JobPayloads, JobQueuePort } from "./job-queue.port";

/**
 * pg-boss adapter — jobs live in the same Postgres as the app data (plan §12,
 * Fase 0), so no extra broker. Queues must exist before send/work; they are
 * created (idempotently) at startup.
 */
export class PgBossJobQueue extends JobQueuePort implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PgBossJobQueue.name);

  constructor(private readonly boss: PgBoss) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Without an "error" listener, a maintenance failure would crash the process.
    this.boss.on("error", (error) => this.logger.error(error));
    await this.boss.start();
    for (const name of JOB_NAMES) {
      await this.boss.createQueue(name);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.boss.stop();
  }

  async publish<Name extends JobName>(name: Name, payload: JobPayloads[Name]): Promise<void> {
    await this.boss.send(name, payload);
  }
}
