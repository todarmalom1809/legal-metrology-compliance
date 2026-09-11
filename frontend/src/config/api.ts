// ============================================================
// API CONFIGURATION
// Replace API_BASE_URL with the real backend URL when provided.
// Replace the endpoint path constants with the real API paths.
// ============================================================

/**
 * Base URL for the backend API.
 * TODO: Replace with the actual backend URL (e.g. "https://api.example.com")
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/**
 * API endpoint paths.
 * These are placeholders — replace with the real paths from the backend team.
 */
export const API_ENDPOINTS = {
  /** POST endpoint for analyzing a product image. Expects multipart/form-data. */
  ANALYZE: '/analyze',
  /** GET endpoint for retrieving scan history. */
  HISTORY: '/history',
  /** GET endpoint for retrieving a specific scan by ID. Use ${scanId} as a URL param. */
  SCAN_DETAILS: '/scan/${scanId}',
} as const;
