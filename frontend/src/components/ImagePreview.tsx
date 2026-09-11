import { RotateCcw, Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  onRetake: () => void;
  onRemove: () => void;
}

export default function ImagePreview({ imageUrl, onRetake, onRemove }: ImagePreviewProps) {
  return (
    <div className="animate-fade-in">
      <div className="card overflow-hidden">
        <div className="relative bg-slate-900">
          <img
            src={imageUrl}
            alt="Captured product label"
            className="max-h-[400px] w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button onClick={onRetake} className="btn-ghost text-slate-600 hover:bg-slate-100">
            <RotateCcw size={16} />
            Retake
          </button>
          <button
            onClick={onRemove}
            className="btn-ghost text-error-600 hover:bg-error-50"
          >
            <Trash2 size={16} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
