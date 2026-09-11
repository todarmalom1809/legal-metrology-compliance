import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { ComplianceCheckItem } from '@/types/api';

interface ComplianceCheckProps {
  checks: ComplianceCheckItem[];
}

const STATUS_STYLES = {
  PASS: {
    icon: CheckCircle2,
    iconColor: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-200',
  },
  FLAG: {
    icon: XCircle,
    iconColor: 'text-error-600',
    bg: 'bg-error-50',
    border: 'border-error-200',
  },
  MANUAL_REVIEW: {
    icon: HelpCircle,
    iconColor: 'text-warning-600',
    bg: 'bg-warning-50',
    border: 'border-warning-200',
  },
} as const;

export default function ComplianceCheck({ checks }: ComplianceCheckProps) {
  if (!checks || checks.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Compliance Checks
        </h3>
        <p className="text-sm text-slate-400">No compliance checks returned.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Compliance Checks
      </h3>
      <ul className="space-y-2.5">
        {checks.map((check, index) => {
          const style = STATUS_STYLES[check.status] ?? STATUS_STYLES.MANUAL_REVIEW;
          const Icon = style.icon;

          return (
            <li
              key={index}
              className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{check.rule}</p>
                {check.message && (
                  <p className="mt-0.5 text-sm text-slate-600">{check.message}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
