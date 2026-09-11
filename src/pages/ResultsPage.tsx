import { ArrowLeft, RotateCw, History, ImageIcon } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ExtractedInfoCard from '@/components/ExtractedInfoCard';
import ComplianceCheck from '@/components/ComplianceCheck';
import WarningCard from '@/components/WarningCard';
import type { ScanResult } from '@/types/api';

interface ResultsPageProps {
  result: ScanResult;
  imageUrl: string | null;
  onBack: () => void;
  onNewScan: () => void;
  onHistoryClick: () => void;
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

export default function ResultsPage({
  result,
  imageUrl,
  onBack,
  onNewScan,
  onHistoryClick,
}: ResultsPageProps) {
  const infoItems = [
    { label: 'Product Name', value: result.productName },
    { label: 'Category', value: result.category },
    { label: 'MRP', value: result.mrp },
    { label: 'Net Quantity', value: result.netQuantity },
    { label: 'Manufacturer / Packer', value: result.manufacturerOrPacker },
    { label: 'Address / Contact', value: result.addressOrContact },
    { label: 'Batch / Lot Number', value: result.batchOrLotNumber },
    { label: 'Mfg / Packing Date', value: result.manufacturingOrPackingDate },
    { label: 'Expiry / Best Before', value: result.expiryOrBestBefore },
  ];

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

        {/* Overall status banner */}
        <div className="card mb-6 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
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
                    Compliance Result
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
          <ExtractedInfoCard title="Extracted Information" items={infoItems} />
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
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={onNewScan} className="btn-primary flex-1">
            <RotateCw size={20} />
            Scan Another Product
          </button>
          <button onClick={onHistoryClick} className="btn-secondary flex-1">
            <History size={20} />
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
