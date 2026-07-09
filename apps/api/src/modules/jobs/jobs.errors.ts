/** Job queue misconfiguration — fail fast at boot, never at publish time. */
export class JobsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobsConfigError";
  }
}
