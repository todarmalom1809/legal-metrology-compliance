import { useState } from 'react';
import { Camera, Upload, ScanLine } from 'lucide-react';
import HoverScanner from '@/components/HoverScanner';

interface ScanUploadProps {
  onCameraCapture: (file: File) => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export default function ScanUpload({
  onCameraCapture,
  onFileUpload,
  disabled = false,
}: ScanUploadProps) {
  const [showScanner, setShowScanner] = useState(false);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCameraCapture(file);
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = '';
  };

  const handleScannerCapture = (file: File) => {
    setShowScanner(false);
    onCameraCapture(file); // same downstream path as the other two options
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Scan with Camera — new hover/auto-capture experience */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          disabled={disabled}
          className={`btn-secondary flex-col gap-2 py-8 ${
            disabled ? 'pointer-events-none opacity-50' : 'hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <ScanLine size={32} className="text-primary-600" />
          <span className="text-base font-semibold">Scan with Camera</span>
          <span className="text-xs font-normal text-slate-500">Auto-capture when aligned</span>
        </button>

        {/* Camera capture — uses the rear camera on mobile devices */}
        <label
          className={`btn-secondary cursor-pointer flex-col gap-2 py-8 ${
            disabled ? 'pointer-events-none opacity-50' : 'hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <Camera size={32} className="text-primary-600" />
          <span className="text-base font-semibold">Take Photo</span>
          <span className="text-xs font-normal text-slate-500">Use your device camera</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraChange}
            disabled={disabled}
            className="hidden"
          />
        </label>

        {/* File upload — standard file picker */}
        <label
          className={`btn-secondary cursor-pointer flex-col gap-2 py-8 ${
            disabled ? 'pointer-events-none opacity-50' : 'hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <Upload size={32} className="text-primary-600" />
          <span className="text-base font-semibold">Upload Image</span>
          <span className="text-xs font-normal text-slate-500">Choose from your device</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </label>
      </div>

      {showScanner && (
        <HoverScanner onCapture={handleScannerCapture} onClose={() => setShowScanner(false)} />
      )}
    </>
  );
}
