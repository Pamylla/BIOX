import Anthropic from "@anthropic-ai/sdk";
import { ExtractorError } from "./extractor.errors";
import {
  EXTRACTOR_MAX_TOKENS,
  EXTRACTOR_MODEL,
  EXTRACTOR_PROMPT_VERSION,
  EXTRACTOR_SYSTEM_PROMPT,
  EXTRACTOR_USER_PROMPT,
} from "./extractor.prompt";
import { type ExtractorResult, ExtractorPort } from "./extractor.port";

const PDF_MEDIA_TYPE = "application/pdf";
const EXTRACTION_TOOL_NAME = "record_lab_report";

/**
 * The single forced tool the model must answer through. Its schema mirrors
 * `extractorOutputSchema` in @biox/shared (raw strings only) — the worker
 * re-validates the model's output against that zod schema (the authority), so
 * this is a generation constraint, not the validation boundary. `strict: true`
 * guarantees the input validates against this schema before it reaches us.
 */
const EXTRACTION_TOOL: Anthropic.Tool = {
  name: EXTRACTION_TOOL_NAME,
  description: "Record every laboratory result transcribed from the report, verbatim.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["collectionDate", "labName", "items"],
    properties: {
      collectionDate: {
        type: ["string", "null"],
        description: "Specimen collection date as YYYY-MM-DD, or null if the report omits it.",
      },
      labName: {
        type: ["string", "null"],
        description: "Performing laboratory's name only — never patient or physician identifiers.",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "rawLabel",
            "rawValue",
            "valueLabel",
            "unit",
            "refLow",
            "refHigh",
            "refRaw",
            "assayMethod",
            "confidence",
          ],
          properties: {
            rawLabel: { type: "string", description: "Marker name exactly as printed." },
            rawValue: {
              type: ["string", "null"],
              description:
                'Value exactly as printed (e.g. "8.610", "< 0,3"); null if qualitative-only.',
            },
            valueLabel: {
              type: ["string", "null"],
              description:
                'Qualitative result text (e.g. "Não reagente"); null for numeric results.',
            },
            unit: {
              type: ["string", "null"],
              description: "Unit exactly as printed; null if none.",
            },
            refLow: {
              type: ["string", "null"],
              description: "Lower reference bound as printed; null if absent.",
            },
            refHigh: {
              type: ["string", "null"],
              description: "Upper reference bound as printed; null if absent.",
            },
            refRaw: {
              type: ["string", "null"],
              description: "Full reference text verbatim; null if absent.",
            },
            assayMethod: {
              type: ["string", "null"],
              description: "Assay method as printed; null if absent.",
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
        },
      },
    },
  },
};

/**
 * Anthropic implementation of the extractor boundary (plan §11.3 step 2). Sends
 * the PDF plus the placeholder prompt and forces the model to answer through a
 * single strict tool, so the returned `input` is already shape-checked. The
 * Anthropic client is injected so the worker's pipeline stays testable without
 * network access.
 */
export class AnthropicExtractor extends ExtractorPort {
  constructor(private readonly client: Anthropic) {
    super();
  }

  async extract(reportPdf: Buffer): Promise<ExtractorResult> {
    const response = await this.client.messages.create({
      model: EXTRACTOR_MODEL,
      max_tokens: EXTRACTOR_MAX_TOKENS,
      system: EXTRACTOR_SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: PDF_MEDIA_TYPE,
                data: reportPdf.toString("base64"),
              },
            },
            { type: "text", text: EXTRACTOR_USER_PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new ExtractorError("The extractor model declined to process the report");
    }
    // A truncated response can carry a well-formed but SHORTENED items array
    // that still passes zod downstream — silently dropping the trailing markers.
    // Fail loudly instead (honors the ExtractorPort "truncates" contract).
    if (response.stop_reason === "max_tokens") {
      throw new ExtractorError(
        "The extractor response was truncated (max_tokens) — the report is too long to transcribe in one pass",
      );
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === EXTRACTION_TOOL_NAME,
    );
    if (!toolUse) {
      throw new ExtractorError(
        `The extractor returned no ${EXTRACTION_TOOL_NAME} output (stop reason: ${response.stop_reason})`,
      );
    }

    return {
      output: toolUse.input,
      model: response.model,
      promptVersion: EXTRACTOR_PROMPT_VERSION,
    };
  }
}
