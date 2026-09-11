import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { WarningItem } from '@/types/api';

interface WarningCardProps {
  warnings: WarningItem[];
}

const SEVERITY_STYLES = {
  high: {
    icon: AlertCircle,
    iconColor: 'text-error-600',
    bg: 'bg-error-50',
    border: 'border-error-200',
    label: 'High',
  },
  medium: {
    icon: AlertTriangle,
    iconColor: 'text-warning-600',
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    label: 'Medium',
  },
  low: {
    icon: Info,
    iconColor: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    label: 'Low',
  },
} as const;

export default function WarningCard({ warnings }: WarningCardProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Warnings &amp; Review Required
      </h3>
      <ul className="space-y-2.5">
        {warnings.map((warning, index) => {
          const style = SEVERITY_STYLES[warning.severity] ?? SEVERITY_STYLES.medium;
          const Icon = style.icon;

          return (
            <li
              key={index}
              className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                {warning.title && (
                  <p className="text-sm font-semibold text-slate-800">{warning.title}</p>
                )}
                <p className="text-sm text-slate-600">{warning.message}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${style.iconColor}`}>
                {style.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
