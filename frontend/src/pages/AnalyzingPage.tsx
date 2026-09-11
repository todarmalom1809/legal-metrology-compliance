import { useEffect, useState } from 'react';
import { Upload, Search, FileCheck2, ScanLine } from 'lucide-react';

interface AnalyzingPageProps {
  imageUrl: string | null;
}

const PROGRESS_STEPS = [
  { icon: Upload, message: 'Uploading image' },
  { icon: Search, message: 'Analyzing product label' },
  { icon: FileCheck2, message: 'Processing results' },
];

export default function AnalyzingPage({ imageUrl }: AnalyzingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Image thumbnail */}
        {imageUrl && (
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Analyzing product"
                className="h-32 w-32 rounded-2xl border-4 border-primary-100 object-cover shadow-lg"
              />
              <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 shadow-lg">
                <ScanLine size={24} className="animate-pulse text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Spinner */}
        <div className="mb-6 flex justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
        </div>

        <h2 className="text-center text-xl font-bold text-slate-900">
          Analyzing Product
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          This may take a few seconds…
        </p>

        {/* Progress steps */}
        <div className="mt-8 space-y-4">
          {PROGRESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isDone = index < currentStep;
            const isActive = index === currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  isActive
                    ? 'border-primary-300 bg-primary-50'
                    : isDone
                    ? 'border-success-200 bg-success-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? 'bg-primary-600'
                      : isDone
                      ? 'bg-success-600'
                      : 'bg-slate-200'
                  }`}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-primary-900'
                      : isDone
                      ? 'text-success-900'
                      : 'text-slate-400'
                  }`}
                >
                  {step.message}
                </span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-[1800ms] ease-out"
            style={{ width: `${((currentStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
