import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { ComplianceStatus } from '@/types/api';

interface StatusBadgeProps {
  status: ComplianceStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  ComplianceStatus,
  {
    label: string;
    classes: string;
    icon: typeof CheckCircle2;
  }
> = {
  PASS: {
    label: 'PASS',
    classes: 'bg-success-50 text-success-700 border-success-200',
    icon: CheckCircle2,
  },
  FLAG: {
    label: 'FLAG',
    classes: 'bg-error-50 text-error-700 border-error-200',
    icon: AlertTriangle,
  },
  MANUAL_REVIEW: {
    label: 'MANUAL REVIEW',
    classes: 'bg-warning-50 text-warning-700 border-warning-200',
    icon: HelpCircle,
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${config.classes} ${sizeClasses}`}
    >
      <Icon size={iconSizes} />
      {config.label}
    </span>
  );
}
