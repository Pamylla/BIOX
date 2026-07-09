/**
 * Background jobs of the ingestion pipeline (plan §11.3). Payloads are keyed
 * by job name so publishers and workers agree at compile time; new jobs
 * (e.g. "insights.generate", phase 6) register here as they come online.
 */
export interface JobPayloads {
  "extraction.run": { extractionId: string };
}

export type JobName = keyof JobPayloads;

export const JOB_NAMES = ["extraction.run"] as const satisfies readonly JobName[];

/**
 * Queue behind the ingestion pipeline. Abstract class (not interface) so it
 * doubles as the Nest injection token — JobsModule binds it to pg-boss.
 */
export abstract class JobQueuePort {
  abstract publish<Name extends JobName>(name: Name, payload: JobPayloads[Name]): Promise<void>;
}
