import { ScanLine, Home, History } from 'lucide-react';
import type { Page } from './BottomNav';

interface HeaderProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ current, onNavigate }: HeaderProps) {
  const isHome = current === 'home';
  const isHistory = current === 'history';

  // Only show header on non-home pages (home has its own hero)
  if (isHome) {
    // Show a minimal top bar on home for desktop
    return (
      <header className="hidden border-b border-slate-200 bg-white/80 backdrop-blur-md sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <ScanLine size={20} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">
              Legal Metrology Compliance Assistant
            </span>
          </button>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`btn-ghost ${isHome ? 'text-primary-600' : ''}`}
            >
              <Home size={18} />
              Home
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`btn-ghost ${isHistory ? 'text-primary-600' : ''}`}
            >
              <History size={18} />
              History
            </button>
          </nav>
        </div>
      </header>
    );
  }

  // On other screens, show a compact header with the app name
  return (
    <header className="hidden border-b border-slate-200 bg-white/80 backdrop-blur-md sm:block">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <ScanLine size={20} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Legal Metrology Compliance Assistant
          </span>
        </button>
      </div>
    </header>
  );
}
