import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ImageIcon, AlertCircle, RotateCw } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ExtractedInfoCard from '@/components/ExtractedInfoCard';
import ComplianceCheck from '@/components/ComplianceCheck';
import WarningCard from '@/components/WarningCard';
import { getScanDetails } from '@/services/apiService';
import type { ScanResult } from '@/types/api';

interface ScanDetailsPageProps {
  scanId: string;
  onBack: () => void;
  onNewScan: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ScanDetailsPage({ scanId, onBack, onNewScan }: ScanDetailsPageProps) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScanDetails(scanId);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load scan details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="animate-fade-in px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost -ml-2">
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
            <p className="mt-4 text-sm text-slate-500">Loading scan details…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50">
              <AlertCircle size={28} className="text-error-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-700">
              Could not load this scan
            </h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={loadDetails} className="btn-secondary">
                <RotateCw size={18} />
                Try Again
              </button>
              <button onClick={onBack} className="btn-ghost">
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {!loading && !error && result && (
          <>
            {/* Status banner */}
            <div className="card mb-6 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt={result.productName ?? 'Scanned product'}
                        className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Scan Details
                      </p>
                      <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                        {result.productName ?? 'Product Analysis'}
                      </h1>
                      {result.scannedAt && (
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(result.scannedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={result.overallStatus} size="lg" />
                </div>
              </div>
            </div>

            {/* Extracted info */}
            <div className="mb-6">
              <ExtractedInfoCard
                title="Extracted Information"
                items={[
                  { label: 'Product Name', value: result.productName },
                  { label: 'Category', value: result.category },
                  { label: 'MRP', value: result.mrp },
                  { label: 'Net Quantity', value: result.netQuantity },
                  { label: 'Manufacturer / Packer', value: result.manufacturerOrPacker },
                  { label: 'Address / Contact', value: result.addressOrContact },
                  { label: 'Batch / Lot Number', value: result.batchOrLotNumber },
                  { label: 'Mfg / Packing Date', value: result.manufacturingOrPackingDate },
                  { label: 'Expiry / Best Before', value: result.expiryOrBestBefore },
                ]}
              />
            </div>

            {/* Compliance checks */}
            {result.complianceChecks && result.complianceChecks.length > 0 && (
              <div className="mb-6">
                <ComplianceCheck checks={result.complianceChecks} />
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-6">
                <WarningCard warnings={result.warnings} />
              </div>
            )}

            {/* Actions */}
            <div className="mt-8">
              <button onClick={onNewScan} className="btn-primary w-full sm:w-auto">
                <RotateCw size={20} />
                Scan Another Product
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
