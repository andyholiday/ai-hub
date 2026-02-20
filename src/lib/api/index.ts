// =============================================================================
// API Utilities - Re-exports
// =============================================================================

export { requireAdmin } from "./admin-auth";
export type { AdminAuthResult, AdminAuthError } from "./admin-auth";

export { requireAuth } from "./require-auth";
export type { AuthResult, AuthError } from "./require-auth";

export {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  apiValidationError,
} from "./response";
