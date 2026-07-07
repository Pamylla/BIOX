import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

/** Error body shape shared by every endpoint (plan §10). */
interface ApiErrorBody {
  error: { code: string; message: string };
}

/**
 * Maps every thrown error to the API error contract:
 * `{ error: { code, message } }`. Throw HttpExceptions with a
 * `{ code, message }` payload to control the code; plain exceptions fall
 * back to a code derived from the HTTP status.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.toBody(exception, status));
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: "internal_error", message: "Unexpected error" },
    });
  }

  private toBody(exception: HttpException, status: number): ApiErrorBody {
    const payload = exception.getResponse();
    const fallbackCode = (HttpStatus[status] ?? "error").toLowerCase();

    if (typeof payload === "string") {
      return { error: { code: fallbackCode, message: payload } };
    }

    const { code, message } = payload as { code?: string; message?: string | string[] };
    return {
      error: {
        code: code ?? fallbackCode,
        // Nest validation errors carry message arrays; join for the contract.
        message: Array.isArray(message) ? message.join("; ") : (message ?? exception.message),
      },
    };
  }
}
