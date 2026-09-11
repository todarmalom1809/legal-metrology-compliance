import { ChevronRight } from 'lucide-react';
import type { ScanHistoryItemData } from '@/types/api';
import StatusBadge from './StatusBadge';

interface ScanHistoryItemProps {
  item: ScanHistoryItemData;
  onClick: (scanId: string) => void;
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

export default function ScanHistoryItem({ item, onClick }: ScanHistoryItemProps) {
  return (
    <button
      onClick={() => onClick(item.id)}
      className="card flex w-full items-center gap-4 p-4 text-left transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.99]"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName ?? 'Scan'}
          className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
          <span className="text-2xl font-bold">?</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {item.productName ?? 'Unknown Product'}
        </p>
        {item.category && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{item.category}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={item.overallStatus} size="sm" />
          {item.scannedAt && (
            <span className="text-xs text-slate-400">{formatDate(item.scannedAt)}</span>
          )}
        </div>
      </div>

      <ChevronRight size={20} className="shrink-0 text-slate-300" />
    </button>
  );
}
