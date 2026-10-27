import { ZodError } from "zod";
import { type DataError, isDataError } from "./data-error";
import { defaultMessage } from "./messages";

export interface ErrorBody {
  error: { code: DataError; message: string };
}

export class AppError extends Error {
  constructor(
    public readonly code: DataError,
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? defaultMessage(code));
    this.name = "AppError";
  }

  static from(e: unknown): AppError {
    if (e instanceof AppError) return e;
    if (e instanceof ZodError) {
      const fields = e.issues.map((i) => i.path.join(".") || "(root)").join(", ");
      return new AppError("UNKNOWN", 400, `Invalid input: ${fields}`);
    }
    return new AppError("SERVER", 500);
  }

  static fromBody(body: unknown, status: number): AppError {
    const err = (body as Partial<ErrorBody> | null)?.error;
    if (err && isDataError(err.code)) return new AppError(err.code, status, err.message);
    if (status >= 500) return new AppError("SERVER", status);
    return new AppError("UNKNOWN", status);
  }
}

export const toErrorBody = (e: AppError): ErrorBody => ({ error: { code: e.code, message: e.message } });
