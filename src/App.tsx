import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import type { Page } from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import ScanPage from '@/pages/ScanPage';
import AnalyzingPage from '@/pages/AnalyzingPage';
import ResultsPage from '@/pages/ResultsPage';
import HistoryPage from '@/pages/HistoryPage';
import ScanDetailsPage from '@/pages/ScanDetailsPage';
import { analyzeProduct } from '@/services/apiService';
import type { ScanResult } from '@/types/api';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const objectUrlRef = useRef<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const navigate = useCallback((target: Page) => {
    setPage(target);
  }, []);

  const handleAnalyze = useCallback(async (image: File) => {
    // Clean up previous preview URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(image);
    objectUrlRef.current = url;
    setScanImage(image);
    setPreviewUrl(url);
    setAnalyzeError(null);
    setPage('analyzing');

    try {
      const result = await analyzeProduct(image);
      setScanResult(result);
      setPage('results');
    } catch (err) {
      setAnalyzeError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing the product.'
      );
      setPage('scan');
    }
  }, []);

  const handleNewScan = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setScanImage(null);
    setPreviewUrl(null);
    setScanResult(null);
    setAnalyzeError(null);
    setPage('scan');
  }, []);

  const handleScanSelect = useCallback((scanId: string) => {
    setSelectedScanId(scanId);
    setPage('details');
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header current={page} onNavigate={navigate} />

      <main className="flex-1 pb-20 sm:pb-0">
        {page === 'home' && (
          <HomePage
            onScanClick={() => navigate('scan')}
            onHistoryClick={() => navigate('history')}
          />
        )}

        {page === 'scan' && (
          <ScanPage
            onBack={() => navigate('home')}
            onAnalyze={handleAnalyze}
          />
        )}

        {page === 'analyzing' && <AnalyzingPage imageUrl={previewUrl} />}

        {page === 'results' && scanResult && (
          <ResultsPage
            result={scanResult}
            imageUrl={previewUrl}
            onBack={() => navigate('home')}
            onNewScan={handleNewScan}
            onHistoryClick={() => navigate('history')}
          />
        )}

        {page === 'history' && (
          <HistoryPage
            onBack={() => navigate('home')}
            onScanClick={() => navigate('scan')}
            onScanSelect={handleScanSelect}
          />
        )}

        {page === 'details' && (
          <ScanDetailsPage
            scanId={selectedScanId}
            onBack={() => navigate('history')}
            onNewScan={handleNewScan}
          />
        )}
      </main>

      {/* Error toast for analyze failures */}
      {analyzeError && page === 'scan' && (
        <div className="fixed bottom-24 left-4 right-4 z-50 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-96 sm:-translate-x-1/2">
          <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 shadow-lg">
            <p className="text-sm font-medium text-error-700">{analyzeError}</p>
          </div>
        </div>
      )}

      <BottomNav current={page} onNavigate={navigate} />
    </div>
  );
}

export default App;
