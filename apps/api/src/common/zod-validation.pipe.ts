import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validates a request body against a shared zod contract
 * (packages/shared/contracts — plan §10). Failures follow the API error
 * contract with code "validation_error".
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      throw new BadRequestException({ code: "validation_error", message: details });
    }
    return result.data;
  }
}
