import { Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import type PgBoss from "pg-boss";
import { JOB_NAMES, type JobName, type JobPayloads, JobQueuePort } from "./job-queue.port";

/** A worker registration, kept as a name↔handler pair so payload types stay linked. */
type Subscription = {
  [Name in JobName]: {
    name: Name;
    handler: (payload: JobPayloads[Name]) => Promise<void>;
  };
}[JobName];

/**
 * pg-boss adapter — jobs live in the same Postgres as the app data (plan §12,
 * Fase 0), so no extra broker. Queues must exist before send/work; they are
 * created (idempotently) at startup.
 */
export class PgBossJobQueue extends JobQueuePort implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PgBossJobQueue.name);
  private readonly subscriptions: Subscription[] = [];
  private started = false;

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
    this.started = true;
    for (const subscription of this.subscriptions) {
      await this.registerWorker(subscription);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.boss.stop();
  }

  async publish<Name extends JobName>(name: Name, payload: JobPayloads[Name]): Promise<void> {
    await this.boss.send(name, payload);
  }

  subscribe<Name extends JobName>(
    name: Name,
    handler: (payload: JobPayloads[Name]) => Promise<void>,
  ): void {
    const subscription = { name, handler } as Subscription;
    this.subscriptions.push(subscription);
    // Consumers usually subscribe from their own onModuleInit, which Nest runs
    // AFTER this provider's (their module imports JobsModule). Registrations
    // that arrive before startup are drained by onModuleInit instead.
    if (this.started) {
      void this.registerWorker(subscription).catch((error) => this.logger.error(error));
    }
  }

  /** pg-boss v10 hands workers a batch (default size 1); the port contract is one payload per call. */
  private async registerWorker({ name, handler }: Subscription): Promise<void> {
    await this.boss.work<JobPayloads[typeof name]>(name, async (jobs) => {
      for (const job of jobs) {
        await handler(job.data);
      }
    });
  }
}
