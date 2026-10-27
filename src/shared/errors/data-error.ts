/** Mirrors KMP DataError.Remote (core/data/network/HttpClientExt.kt) + two web-only codes. */
export const DataError = {
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  NO_INTERNET: "NO_INTERNET",
  SERVER: "SERVER",
  SERIALIZATION: "SERIALIZATION",
  UNKNOWN: "UNKNOWN",
  NOT_FOUND: "NOT_FOUND",
  INVALID_PAGE: "INVALID_PAGE",
  SERVICE_NOT_IN_PLAN: "SERVICE_NOT_IN_PLAN",
  USERNAME_IS_NOT_VALID: "USERNAME_IS_NOT_VALID",
  PASSWORD_IS_NOT_VALID: "PASSWORD_IS_NOT_VALID",
  WRONG_OLD_PASSWORD: "WRONG_OLD_PASSWORD",
  WRONG_VERIFICATION_CODE: "WRONG_VERIFICATION_CODE",
  OUT_OF_CREDIT: "OUT_OF_CREDIT",
  REPEATED_EMAIL: "REPEATED_EMAIL",
  USER_NOT_EXIST: "USER_NOT_EXIST",
  EMAIL_IS_NOT_VALID_FORGET_PASSWORD: "EMAIL_IS_NOT_VALID_FORGET_PASSWORD",
  // web-only (the app's token never expires)
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
} as const;
export type DataError = (typeof DataError)[keyof typeof DataError];

export const isDataError = (value: unknown): value is DataError =>
  typeof value === "string" && value in DataError;
