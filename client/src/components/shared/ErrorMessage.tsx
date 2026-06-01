import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message = 'Something went wrong while loading your data.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#FEE2E2' }}
      >
        <AlertCircle className="w-8 h-8" style={{ color: '#DC2626' }} />
      </div>
      <div className="text-center">
        <p className="text-[#374151]" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
