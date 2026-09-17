interface ErrorStateProps {
  error?: string;
  message?: string;
  statusCode?: number;
  onRetry?: () => void;
}

export function ErrorState({ error, message, statusCode, onRetry }: ErrorStateProps) {
  const displayMessage = error || message || 'An error occurred';

  const getErrorMessage = (): string => {
    if (statusCode === 401) {
      return 'You need to sign in to access this. Please sign in and try again.';
    }
    if (statusCode === 403) {
      return 'You don\'t have permission to access this resource.';
    }
    if (statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (statusCode === 409) {
      return 'This item already exists or there\'s a conflict.';
    }
    if (statusCode && statusCode >= 500) {
      return 'Something went wrong on our end. Please try again.';
    }
    return displayMessage;
  };

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 error state"
    >
      <p className="text-sm font-medium text-red-900">Error</p>
      <p className="mt-1 text-sm text-red-700">{getErrorMessage()}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
