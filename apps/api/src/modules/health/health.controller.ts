import { Controller, Get } from "@nestjs/common";
import { BIOMARKER_SEED } from "@biox/shared";

/** Liveness endpoint: GET /v1/health. */
@Controller("health")
export class HealthController {
  @Get()
  check(): {
    status: "ok";
    service: string;
    catalogMarkers: number;
    timestamp: string;
  } {
    return {
      status: "ok",
      service: "biox-api",
      // Proves the deterministic @biox/shared core loaded in-process — a real
      // build-integrity signal, not a hardcoded number.
      catalogMarkers: BIOMARKER_SEED.length,
      timestamp: new Date().toISOString(),
    };
  }
}
