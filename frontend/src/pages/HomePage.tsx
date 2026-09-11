import { ScanLine, Search, ShieldCheck, History, Camera, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onScanClick: () => void;
  onHistoryClick: () => void;
}

const STEPS = [
  {
    icon: Camera,
    title: 'Scan',
    description: 'Take a photo or upload an image of a product label.',
  },
  {
    icon: Search,
    title: 'Analyze',
    description: 'The system reads and extracts label information automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Check Compliance',
    description: 'Get an instant compliance report against Legal Metrology rules.',
  },
];

export default function HomePage({ onScanClick, onHistoryClick }: HomePageProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/20">
            <ScanLine size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Legal Metrology Compliance Assistant
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Scan any product label to instantly check compliance with Indian Legal Metrology
            packaging and labelling regulations.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={onScanClick} className="btn-primary w-full sm:w-auto">
              <ScanLine size={20} />
              Scan Product
            </button>
            <button onClick={onHistoryClick} className="btn-secondary w-full sm:w-auto">
              <History size={20} />
              View History
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="card p-6 text-center relative">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                      <Icon size={24} className="text-primary-600" />
                    </div>
                  </div>
                  <div className="mb-1 text-xs font-bold text-primary-500">
                    STEP {index + 1}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
                  {index < STEPS.length - 1 && (
                    <ArrowRight
                      size={20}
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 sm:block"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
