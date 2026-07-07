import { BadRequestException } from "@nestjs/common";
import { updateUserProfileSchema } from "@biox/shared";
import { describe, expect, it } from "vitest";
import { ZodValidationPipe } from "./zod-validation.pipe";

const pipe = new ZodValidationPipe(updateUserProfileSchema);

describe("ZodValidationPipe", () => {
  it("returns the parsed value for a valid body", () => {
    expect(pipe.transform({ name: "  Marina  ", dateOfBirth: "1991-05-12" })).toEqual({
      name: "Marina",
      dateOfBirth: "1991-05-12",
    });
  });

  it("accepts an empty PATCH body (all fields optional)", () => {
    expect(pipe.transform({})).toEqual({});
  });

  it("rejects an invalid field with code validation_error and the field path", () => {
    try {
      pipe.transform({ dateOfBirth: "12/05/1991" });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const payload = (error as BadRequestException).getResponse() as {
        code: string;
        message: string;
      };
      expect(payload.code).toBe("validation_error");
      expect(payload.message).toContain("dateOfBirth");
    }
  });

  it("rejects wrong types", () => {
    expect(() => pipe.transform({ flagBorderline: "yes" })).toThrow(BadRequestException);
  });
});
