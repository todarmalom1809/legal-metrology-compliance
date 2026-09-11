import { Home, ScanLine, History } from 'lucide-react';

export type Page = 'home' | 'scan' | 'analyzing' | 'results' | 'history' | 'details';

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof Home }[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'scan', label: 'Scan', icon: ScanLine },
  { page: 'history', label: 'History', icon: History },
];

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  // Hide bottom nav on analyzing/results/details — those are flow-locked screens
  const hiddenOn: Page[] = ['analyzing', 'results', 'details'];
  if (hiddenOn.includes(current)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md sm:hidden">
      <div className="grid grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'text-primary-600' : 'text-slate-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
