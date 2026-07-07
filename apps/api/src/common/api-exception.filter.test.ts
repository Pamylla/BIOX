import {
  type ArgumentsHost,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApiExceptionFilter } from "./api-exception.filter";

function catchWith(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn((statusCode: number) => ({ json, statusCode }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new ApiExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0]?.[0], body: json.mock.calls[0]?.[0] };
}

describe("ApiExceptionFilter", () => {
  it("keeps the custom code from a { code, message } payload", () => {
    const { status, body } = catchWith(
      new UnauthorizedException({ code: "invalid_token", message: "Token expired" }),
    );

    expect(status).toBe(401);
    expect(body).toEqual({ error: { code: "invalid_token", message: "Token expired" } });
  });

  it("derives the code from the HTTP status when none is given", () => {
    const { status, body } = catchWith(new NotFoundException("Batch not found"));

    expect(status).toBe(404);
    expect(body).toEqual({ error: { code: "not_found", message: "Batch not found" } });
  });

  it("joins validation message arrays", () => {
    const { body } = catchWith(new BadRequestException({ message: ["a is bad", "b is bad"] }));

    expect(body).toEqual({ error: { code: "bad_request", message: "a is bad; b is bad" } });
  });

  it("maps unknown exceptions to a generic 500", () => {
    const { status, body } = catchWith(new Error("boom"));

    expect(status).toBe(500);
    expect(body).toEqual({ error: { code: "internal_error", message: "Unexpected error" } });
  });
});
