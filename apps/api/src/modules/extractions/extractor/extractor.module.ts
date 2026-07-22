import Anthropic from "@anthropic-ai/sdk";
import { Module } from "@nestjs/common";
import { readEnv } from "../../../common/env";
import { AnthropicExtractor } from "./anthropic.extractor";
import { ExtractorConfigError } from "./extractor.errors";
import { ExtractorPort } from "./extractor.port";

/** Pure so the driver is testable without touching process.env — mirrors StorageModule/JobsModule. */
export function createExtractor(env: NodeJS.ProcessEnv): ExtractorPort {
  const apiKey = readEnv(env, "ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new ExtractorConfigError(
      "ANTHROPIC_API_KEY is required — the extraction worker calls Anthropic",
    );
  }
  return new AnthropicExtractor(new Anthropic({ apiKey }));
}

/** Binds ExtractorPort to the Anthropic adapter. Consumers inject ExtractorPort, never the SDK. */
@Module({
  providers: [{ provide: ExtractorPort, useFactory: () => createExtractor(process.env) }],
  exports: [ExtractorPort],
})
export class ExtractorModule {}
