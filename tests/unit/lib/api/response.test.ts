// =============================================================================
// Tests: API Response Helpers
// =============================================================================

import { describe, it, expect } from "vitest";
import { ZodError, ZodIssue } from "zod";
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";

// ---------------------------------------------------------------------------
// apiSuccess
// ---------------------------------------------------------------------------

describe("apiSuccess", () => {
  it("should return data with null error and status 200 by default", async () => {
    const response = apiSuccess({ id: 1, name: "Test" });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toEqual({ id: 1, name: "Test" });
    expect(body.error).toBeNull();
  });

  it("should accept a custom status code", async () => {
    const response = apiSuccess("created", 201);

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data).toBe("created");
    expect(body.error).toBeNull();
  });

  it("should handle null data", async () => {
    const response = apiSuccess(null);

    const body = await response.json();
    expect(body.data).toBeNull();
    expect(body.error).toBeNull();
  });

  it("should handle array data", async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const response = apiSuccess(items);

    const body = await response.json();
    expect(body.data).toEqual(items);
    expect(body.data).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// apiError
// ---------------------------------------------------------------------------

describe("apiError", () => {
  it("should return error with null data and correct status", async () => {
    const response = apiError("CUSTOM_ERROR", "Something went wrong", 422);

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.data).toBeNull();
    expect(body.error).toEqual({
      code: "CUSTOM_ERROR",
      message: "Something went wrong",
    });
  });

  it("should include details when provided", async () => {
    const details = { email: ["Invalid email format"] };
    const response = apiError("VALIDATION", "Invalid input", 400, details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("should not include details key when not provided", async () => {
    const response = apiError("ERROR", "fail", 500);

    const body = await response.json();
    expect(body.error.details).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// apiBadRequest
// ---------------------------------------------------------------------------

describe("apiBadRequest", () => {
  it("should return 400 with BAD_REQUEST code", async () => {
    const response = apiBadRequest("Missing required field");

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("Missing required field");
  });

  it("should include validation details when provided", async () => {
    const details = { name: ["Name is required"], age: ["Must be a number"] };
    const response = apiBadRequest("Validation failed", details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });
});

// ---------------------------------------------------------------------------
// apiNotFound
// ---------------------------------------------------------------------------

describe("apiNotFound", () => {
  it("should return 404 with NOT_FOUND code and default message", async () => {
    const response = apiNotFound();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Resource not found");
  });

  it("should accept a custom message", async () => {
    const response = apiNotFound("User not found");

    const body = await response.json();
    expect(body.error.message).toBe("User not found");
  });
});

// ---------------------------------------------------------------------------
// apiInternalError
// ---------------------------------------------------------------------------

describe("apiInternalError", () => {
  it("should return 500 with INTERNAL_ERROR code and default message", async () => {
    const response = apiInternalError();

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Internal server error");
  });

  it("should accept a custom message", async () => {
    const response = apiInternalError("Database connection failed");

    const body = await response.json();
    expect(body.error.message).toBe("Database connection failed");
  });
});

// ---------------------------------------------------------------------------
// apiValidationError
// ---------------------------------------------------------------------------

describe("apiValidationError", () => {
  it("should format ZodError issues into details keyed by path", async () => {
    const issues: ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["email"],
        message: "Expected string, received number",
      },
      {
        code: "too_small",
        minimum: 1,
        inclusive: true,
        exact: false,
        type: "string",
        path: ["name"],
        message: "Name is required",
      },
    ];
    const zodError = new ZodError(issues);

    const response = apiValidationError(zodError);

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("Validation failed");
    expect(body.error.details).toEqual({
      email: ["Expected string, received number"],
      name: ["Name is required"],
    });
  });

  it("should group multiple errors on the same path", async () => {
    const issues: ZodIssue[] = [
      {
        code: "too_small",
        minimum: 8,
        inclusive: true,
        exact: false,
        type: "string",
        path: ["password"],
        message: "Password must be at least 8 characters",
      },
      {
        code: "invalid_string",
        validation: "regex",
        path: ["password"],
        message: "Password must contain a number",
      },
    ];
    const zodError = new ZodError(issues);

    const response = apiValidationError(zodError);

    const body = await response.json();
    expect(body.error.details.password).toEqual([
      "Password must be at least 8 characters",
      "Password must contain a number",
    ]);
  });

  it("should use _root as key for root-level errors (empty path)", async () => {
    const issues: ZodIssue[] = [
      {
        code: "custom",
        path: [],
        message: "At least one field is required",
      },
    ];
    const zodError = new ZodError(issues);

    const response = apiValidationError(zodError);

    const body = await response.json();
    expect(body.error.details._root).toEqual([
      "At least one field is required",
    ]);
  });

  it("should join nested paths with dots", async () => {
    const issues: ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["address", "street"],
        message: "Street is required",
      },
    ];
    const zodError = new ZodError(issues);

    const response = apiValidationError(zodError);

    const body = await response.json();
    expect(body.error.details["address.street"]).toEqual([
      "Street is required",
    ]);
  });
});
