import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, History as HistoryIcon, Inbox } from 'lucide-react';
import ScanHistoryItem from '@/components/ScanHistoryItem';
import { getScanHistory } from '@/services/apiService';
import type { ScanHistoryItemData } from '@/types/api';

interface HistoryPageProps {
  onBack: () => void;
  onScanClick: () => void;
  onScanSelect: (scanId: string) => void;
}

export default function HistoryPage({ onBack, onScanClick, onScanSelect }: HistoryPageProps) {
  const [scans, setScans] = useState<ScanHistoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScanHistory();
      setScans(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load scan history. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="animate-fade-in px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost -ml-2">
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
            <HistoryIcon size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
            <p className="text-sm text-slate-500">Your previous compliance scans</p>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
            <p className="mt-4 text-sm text-slate-500">Loading history…</p>
          </div>
        )}

        {!loading && error && (
          <div className="card p-6 text-center">
            <p className="text-sm font-medium text-error-600">{error}</p>
            <button onClick={loadHistory} className="btn-secondary mt-4">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && scans.length === 0 && (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Inbox size={28} className="text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-700">No scans yet.</h2>
            <p className="mt-1 text-sm text-slate-500">
              Scan your first product to see results here.
            </p>
            <button onClick={onScanClick} className="btn-primary mt-6">
              Scan Product
            </button>
          </div>
        )}

        {!loading && !error && scans.length > 0 && (
          <div className="space-y-3">
            {scans.map((scan) => (
              <ScanHistoryItem
                key={scan.id}
                item={scan}
                onClick={onScanSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
