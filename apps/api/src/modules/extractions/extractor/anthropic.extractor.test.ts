import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnthropicExtractor } from "./anthropic.extractor";
import { ExtractorError } from "./extractor.errors";
import { EXTRACTOR_PROMPT_VERSION } from "./extractor.prompt";

const toolOutput = {
  collectionDate: "2026-03-14",
  labName: "Fleury",
  items: [{ rawLabel: "Ferritina", rawValue: "8.610", confidence: "high" }],
};

function respondWith(response: unknown) {
  const create = vi.fn().mockResolvedValue(response);
  const client = { messages: { create } } as unknown as Anthropic;
  return { client, create };
}

describe("AnthropicExtractor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the PDF as a base64 document, forces the tool, and returns the tool input", async () => {
    const { client, create } = respondWith({
      model: "claude-opus-4-8",
      stop_reason: "tool_use",
      content: [{ type: "tool_use", name: "record_lab_report", input: toolOutput }],
    });

    const result = await new AnthropicExtractor(client).extract(Buffer.from("%PDF-1.7 fake"));

    expect(result.output).toEqual(toolOutput);
    expect(result.model).toBe("claude-opus-4-8");
    expect(result.promptVersion).toBe(EXTRACTOR_PROMPT_VERSION);

    const request = create.mock.calls[0]?.[0];
    expect(request.tool_choice).toEqual({ type: "tool", name: "record_lab_report" });
    const document = request.messages[0].content[0];
    expect(document.type).toBe("document");
    expect(document.source.media_type).toBe("application/pdf");
    expect(document.source.data).toBe(Buffer.from("%PDF-1.7 fake").toString("base64"));
  });

  it("throws ExtractorError when the model refuses", async () => {
    const { client } = respondWith({
      model: "claude-opus-4-8",
      stop_reason: "refusal",
      content: [],
    });

    await expect(new AnthropicExtractor(client).extract(Buffer.from("x"))).rejects.toBeInstanceOf(
      ExtractorError,
    );
  });

  it("throws ExtractorError when the response is truncated, rather than dropping markers", async () => {
    const { client } = respondWith({
      model: "claude-opus-4-8",
      stop_reason: "max_tokens",
      // A partial-but-well-formed tool call — the danger is it looks complete.
      content: [{ type: "tool_use", name: "record_lab_report", input: { items: [] } }],
    });

    await expect(new AnthropicExtractor(client).extract(Buffer.from("x"))).rejects.toBeInstanceOf(
      ExtractorError,
    );
  });

  it("throws ExtractorError when the response carries no extraction tool call", async () => {
    const { client } = respondWith({
      model: "claude-opus-4-8",
      stop_reason: "end_turn",
      content: [{ type: "text", text: "I could not read this document." }],
    });

    await expect(new AnthropicExtractor(client).extract(Buffer.from("x"))).rejects.toBeInstanceOf(
      ExtractorError,
    );
  });
});
