// ============================================================
// API SERVICE LAYER
// All backend communication lives here.
// UI components should import these functions — never call fetch directly.
//
// To connect the real backend:
//   1. Set API_BASE_URL in src/config/api.ts (or VITE_API_BASE_URL env var)
//   2. Replace the endpoint path constants in src/config/api.ts
//   3. Adjust the response mapping in the functions below if needed
// ============================================================

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import type { ScanResult, ScanHistoryItemData } from '@/types/api';

// ---------- Types ----------

export interface AnalyzeResponse {
  result: ScanResult;
}

// ---------- Helpers ----------

function buildUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Maps a raw backend response into the ScanResult shape the frontend expects.
 * Adjust this function if the backend returns a different structure.
 */
function mapScanResult(raw: unknown): ScanResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    id: (data.id as string) ?? (data.scan_id as string) ?? undefined,
    overallStatus: (data.overallStatus as ScanResult['overallStatus'])
      ?? (data.overall_status as ScanResult['overallStatus'])
      ?? 'MANUAL_REVIEW',
    productName: (data.productName as string) ?? (data.product_name as string) ?? undefined,
    category: (data.category as string) ?? undefined,
    mrp: (data.mrp as string) ?? undefined,
    netQuantity: (data.netQuantity as string) ?? (data.net_quantity as string) ?? undefined,
    manufacturerOrPacker:
      (data.manufacturerOrPacker as string)
      ?? (data.manufacturer_or_packer as string) ?? undefined,
    addressOrContact:
      (data.addressOrContact as string)
      ?? (data.address_or_contact as string) ?? undefined,
    batchOrLotNumber:
      (data.batchOrLotNumber as string)
      ?? (data.batch_or_lot_number as string) ?? undefined,
    manufacturingOrPackingDate:
      (data.manufacturingOrPackingDate as string)
      ?? (data.manufacturing_or_packing_date as string) ?? undefined,
    expiryOrBestBefore:
      (data.expiryOrBestBefore as string)
      ?? (data.expiry_or_best_before as string) ?? undefined,
    complianceChecks:
      (data.complianceChecks as ScanResult['complianceChecks'])
      ?? (data.compliance_checks as ScanResult['complianceChecks'])
      ?? undefined,
    warnings:
      (data.warnings as ScanResult['warnings']) ?? undefined,
    scannedAt: (data.scannedAt as string) ?? (data.scanned_at as string) ?? undefined,
    imageUrl: (data.imageUrl as string) ?? (data.image_url as string) ?? undefined,
  };
}

/**
 * Maps a raw backend response into a history item.
 */
function mapHistoryItem(raw: unknown): ScanHistoryItemData {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    id: (data.id as string) ?? (data.scan_id as string) ?? '',
    productName: (data.productName as string) ?? (data.product_name as string) ?? undefined,
    overallStatus: (data.overallStatus as ScanHistoryItemData['overallStatus'])
      ?? (data.overall_status as ScanHistoryItemData['overallStatus'])
      ?? 'MANUAL_REVIEW',
    scannedAt: (data.scannedAt as string) ?? (data.scanned_at as string) ?? undefined,
    imageUrl: (data.imageUrl as string) ?? (data.image_url as string) ?? undefined,
    category: (data.category as string) ?? undefined,
  };
}

// ---------- API Functions ----------

/**
 * Sends a product image to the backend for analysis.
 * The image is sent as multipart/form-data.
 *
 * @param image - File object from camera capture or file upload
 * @returns The analysis result from the backend
 */
export async function analyzeProduct(image: File): Promise<ScanResult> {
  const url = buildUrl(API_ENDPOINTS.ANALYZE);

  const formData = new FormData();
  // NOTE: field name must be "file" — that's what FastAPI's
  // `file: UploadFile = File(...)` parameter expects.
  formData.append('file', image);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
  }

  const json: unknown = await response.json();
  const raw = (json as Record<string, unknown>)?.result ?? json;
  return mapScanResult(raw);
}

/**
 * Retrieves the scan history from the backend.
 *
 * @returns Array of past scan records
 */
export async function getScanHistory(): Promise<ScanHistoryItemData[]> {
  const url = buildUrl(API_ENDPOINTS.HISTORY);

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to load history: ${response.status} ${response.statusText}`);
  }

  const json: unknown = await response.json();
  const rawItems = (json as Record<string, unknown>)?.scans
    ?? (json as Record<string, unknown>)?.history
    ?? (Array.isArray(json) ? json : []);

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return (rawItems as unknown[]).map(mapHistoryItem);
}

/**
 * Retrieves details for a specific scan by its ID.
 *
 * @param scanId - The unique identifier of the scan
 * @returns Detailed scan result
 */
export async function getScanDetails(scanId: string): Promise<ScanResult> {
  const path = API_ENDPOINTS.SCAN_DETAILS.replace('${scanId}', scanId);
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to load scan: ${response.status} ${response.statusText}`);
  }

  const json: unknown = await response.json();
  const raw = (json as Record<string, unknown>)?.result ?? json;
  return mapScanResult(raw);
}
