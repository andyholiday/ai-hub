// =============================================================================
// API Response Helpers
// Consistent JSON response builders for all API routes.
// Follows the ApiResponse<T> shape from src/types/api.ts.
// =============================================================================

import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { ApiResponse, ApiError, PaginationMeta } from "@/types/api";

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

export function apiSuccess<T>(data: T, status = 200, meta?: PaginationMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, ...(meta ? { meta } : {}) }, { status });
}

// ---------------------------------------------------------------------------
// Error builders
// ---------------------------------------------------------------------------

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse<ApiResponse<null>> {
  const error: ApiError = { code, message };
  if (details) error.details = details;
  return NextResponse.json({ data: null, error }, { status });
}

export function apiBadRequest(
  message: string,
  details?: Record<string, string[]>,
): NextResponse<ApiResponse<null>> {
  return apiError("BAD_REQUEST", message, 400, details);
}

export function apiNotFound(message = "Resource not found"): NextResponse<ApiResponse<null>> {
  return apiError("NOT_FOUND", message, 404);
}

export function apiInternalError(message = "Internal server error"): NextResponse<ApiResponse<null>> {
  return apiError("INTERNAL_ERROR", message, 500);
}

// ---------------------------------------------------------------------------
// Zod validation error formatter
// ---------------------------------------------------------------------------

export function apiValidationError(zodError: ZodError): NextResponse<ApiResponse<null>> {
  const details: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join(".") || "_root";
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return apiBadRequest("Validation failed", details);
}
