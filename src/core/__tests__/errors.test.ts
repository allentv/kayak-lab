import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "@std/assert";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  RateLimitError,
  ExternalServiceError,
  InternalError,
  ErrorCodes,
} from "../errors.ts";

Deno.test("Error Taxonomy", async (t) => {
  await t.step("AppError has correct defaults", () => {
    const error = new AppError("test", ErrorCodes.INTERNAL, "git", "clone");
    assertInstanceOf(error, AppError);
    assertInstanceOf(error, Error);
    assertEquals(error.code, ErrorCodes.INTERNAL);
    assertEquals(error.module, "git");
    assertEquals(error.operation, "clone");
    assertEquals(error.retryable, false);
    assertEquals(error.context, {});
    assertEquals(error.name, "AppError");
  });

  await t.step("AppError defaults module and operation", () => {
    const error = new AppError("test", ErrorCodes.VALIDATION);
    assertEquals(error.module, "unknown");
    assertEquals(error.operation, "unknown");
  });

  await t.step("AppError carries context", () => {
    const error = new AppError(
      "test",
      ErrorCodes.INTERNAL,
      "shell",
      "exec",
      false,
      { pid: 1234 },
    );
    assertEquals(error.context, { pid: 1234 });
  });

  await t.step("ValidationError defaults and is not retryable", () => {
    const error = new ValidationError("bad input", "git", "commit");
    assertEquals(error.code, ErrorCodes.VALIDATION);
    assertEquals(error.retryable, false);
    assertEquals(error.module, "git");
    assertEquals(error.name, "ValidationError");
  });

  await t.step("AuthenticationError is not retryable", () => {
    const error = new AuthenticationError("bad token", "github", "api_call");
    assertEquals(error.code, ErrorCodes.AUTHENTICATION);
    assertEquals(error.retryable, false);
    assertEquals(error.name, "AuthenticationError");
  });

  await t.step("AuthorizationError is not retryable", () => {
    const error = new AuthorizationError("no access", "github", "push");
    assertEquals(error.code, ErrorCodes.AUTHORIZATION);
    assertEquals(error.retryable, false);
    assertEquals(error.name, "AuthorizationError");
  });

  await t.step("NotFoundError is not retryable", () => {
    const error = new NotFoundError("not found", "git", "log");
    assertEquals(error.code, ErrorCodes.NOT_FOUND);
    assertEquals(error.retryable, false);
    assertEquals(error.name, "NotFoundError");
  });

  await t.step("TimeoutError is retryable", () => {
    const error = new TimeoutError("timed out", "shell", "exec");
    assertEquals(error.code, ErrorCodes.TIMEOUT);
    assertEquals(error.retryable, true);
    assertEquals(error.name, "TimeoutError");
  });

  await t.step("RateLimitError is retryable with retryAfterMs", () => {
    const error = new RateLimitError(
      "rate limited",
      "github",
      "api_call",
      5000,
    );
    assertEquals(error.code, ErrorCodes.RATE_LIMIT);
    assertEquals(error.retryable, true);
    assertEquals(error.context.retryAfterMs, 5000);
    assertEquals(error.retryAfterMs, 5000);
    assertEquals(error.name, "RateLimitError");
  });

  await t.step("ExternalServiceError is retryable with statusCode", () => {
    const error = new ExternalServiceError(
      "service down",
      "github",
      "api_call",
      503,
    );
    assertEquals(error.code, ErrorCodes.EXTERNAL_SERVICE);
    assertEquals(error.retryable, true);
    assertEquals(error.context.statusCode, 503);
    assertEquals(error.statusCode, 503);
    assertEquals(error.name, "ExternalServiceError");
  });

  await t.step("InternalError is retryable with cause", () => {
    const cause = new Error("root cause");
    const error = new InternalError("internal", "core", "run", cause);
    assertEquals(error.code, ErrorCodes.INTERNAL);
    assertEquals(error.retryable, true);
    assertStrictEquals(error.cause, cause);
    assertEquals(error.name, "InternalError");
  });

  await t.step("error codes are all unique strings", () => {
    const codes = Object.values(ErrorCodes);
    const unique = new Set(codes);
    assertEquals(codes.length, unique.size);
  });
});
