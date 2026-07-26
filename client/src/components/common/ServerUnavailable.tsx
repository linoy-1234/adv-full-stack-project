import { LogOut, WifiOff } from "lucide-react";

interface ServerUnavailableProps {
  message: string;
  onLogout: () => void;
}

export function ServerUnavailable({ message, onLogout }: ServerUnavailableProps) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#FAF8F5", fontFamily: "Nunito, sans-serif" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-md text-white"
        style={{ backgroundColor: "#7CAE8E" }}
      >
        <WifiOff className="w-10 h-10" aria-hidden="true" />
      </div>

      <h1 className="mb-3" style={{ color: "#2D4739" }}>
        Server Unavailable
      </h1>
      <p className="text-sm max-w-xs mb-8" style={{ color: "#6B7280" }}>
        {message}
      </p>

      <div className="text-5xl mb-8" aria-hidden="true">
        📡
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#7CAE8E" }}
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Log Out
      </button>
    </main>
  );
}
