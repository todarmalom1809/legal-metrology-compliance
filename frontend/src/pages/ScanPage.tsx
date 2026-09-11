import { useRef, useState } from 'react';
import { ArrowLeft, ScanLine, Sparkles } from 'lucide-react';
import ScanUpload from '@/components/ScanUpload';
import ImagePreview from '@/components/ImagePreview';

interface ScanPageProps {
  onBack: () => void;
  onAnalyze: (image: File) => void;
}

export default function ScanPage({ onBack, onAnalyze }: ScanPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const handleFileSelected = (file: File) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleRetake = () => {
    setSelectedFile(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  const handleRemove = () => {
    handleRetake();
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="animate-fade-in px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost -ml-2">
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Scan Product</h1>
        <p className="mt-2 text-base text-slate-600">
          Take a clear photo of the product label, or upload an existing image.
        </p>

        {/* Upload area or preview */}
        <div className="mt-8">
          {previewUrl ? (
            <ImagePreview
              imageUrl={previewUrl}
              onRetake={handleRetake}
              onRemove={handleRemove}
            />
          ) : (
            <ScanUpload
              onCameraCapture={handleFileSelected}
              onFileUpload={handleFileSelected}
            />
          )}
        </div>

        {/* Analyze button */}
        {selectedFile && (
          <div className="mt-6 animate-slide-up">
            <button
              onClick={handleAnalyze}
              className="btn-primary w-full"
            >
              <Sparkles size={20} />
              Analyze Product
            </button>
          </div>
        )}

        {/* Tips */}
        {!selectedFile && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ScanLine size={20} className="mt-0.5 shrink-0 text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Tips for best results</p>
                <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
                  <li>• Ensure good lighting and the label is in focus</li>
                  <li>• Fill the frame with the label — avoid excessive background</li>
                  <li>• Keep the camera parallel to the label surface</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
