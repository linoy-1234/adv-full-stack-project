import { Home, Leaf } from 'lucide-react';

interface NotFoundProps {
  onGoHome: () => void;
}

export function NotFound({ onGoHome }: NotFoundProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-md"
        style={{ backgroundColor: '#7CAE8E' }}
      >
        <Leaf className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-6xl mb-3" style={{ color: '#2D4739' }}>404</h1>
      <h2 className="mb-3" style={{ color: '#374151' }}>Page Not Found</h2>
      <p className="text-sm max-w-xs mb-8" style={{ color: '#6B7280' }}>
        The page you're looking for doesn't exist. Don't worry — every path eventually leads somewhere good.
      </p>

      <div className="text-5xl mb-8">🌱</div>

      <button
        onClick={onGoHome}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#7CAE8E' }}
      >
        <Home className="w-4 h-4" />
        Go Back Home
      </button>
    </div>
  );
}
