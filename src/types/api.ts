// ============================================================
// API TYPES
// These types represent the expected shape of backend responses.
// They are designed to be easy to modify once the real API
// response structure is provided by the backend team.
// ============================================================

export type ComplianceStatus = 'PASS' | 'FLAG' | 'MANUAL_REVIEW';

export interface ComplianceCheckItem {
  /** Name of the compliance rule being checked, e.g. "MRP Displayed" */
  rule: string;
  /** Whether this individual check passed, failed, or needs manual review */
  status: ComplianceStatus;
  /** Optional explanation or detail from the backend */
  message?: string;
}

export interface WarningItem {
  /** Severity level of the warning */
  severity: 'high' | 'medium' | 'low';
  /** Warning message text */
  message: string;
  /** Optional title/heading for the warning */
  title?: string;
}

export interface ScanResult {
  /** Unique scan identifier from the backend */
  id?: string;
  /** Overall compliance status determined by the backend */
  overallStatus: ComplianceStatus;
  /** Extracted product information */
  productName?: string;
  category?: string;
  mrp?: string;
  netQuantity?: string;
  manufacturerOrPacker?: string;
  addressOrContact?: string;
  batchOrLotNumber?: string;
  manufacturingOrPackingDate?: string;
  expiryOrBestBefore?: string;
  /** List of individual compliance checks */
  complianceChecks?: ComplianceCheckItem[];
  /** Warnings or items requiring manual review */
  warnings?: WarningItem[];
  /** ISO timestamp of when the scan was performed */
  scannedAt?: string;
  /** URL or path to the scanned image (if returned by backend) */
  imageUrl?: string;
}

export interface ScanHistoryItemData {
  id: string;
  productName?: string;
  overallStatus: ComplianceStatus;
  scannedAt?: string;
  imageUrl?: string;
  category?: string;
}
