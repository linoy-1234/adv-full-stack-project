import { X } from "lucide-react";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage = ({
  message = "Something went wrong.",
  onRetry,
  onDismiss,
  className = "",
}: ErrorMessageProps) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between gap-3 ${className}`}
    >
      <span>{message}</span>

      {(onRetry || onDismiss) && (
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Try again
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
