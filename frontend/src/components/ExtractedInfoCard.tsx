import type { ReactNode } from 'react';

interface ExtractedInfoCardProps {
  title: string;
  items: { label: string; value?: string }[];
  emptyMessage?: string;
  children?: ReactNode;
}

export default function ExtractedInfoCard({
  title,
  items,
  emptyMessage = 'No information extracted',
  children,
}: ExtractedInfoCardProps) {
  const hasItems = items.some((item) => item.value && item.value.trim() !== '');

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      {hasItems ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {item.value && item.value.trim() !== '' ? item.value : (
                  <span className="text-slate-300">—</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      )}

      {children}
    </div>
  );
}
