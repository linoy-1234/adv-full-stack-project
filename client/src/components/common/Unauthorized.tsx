import { LayoutDashboard, ShieldX } from "lucide-react";

interface UnauthorizedProps {
  onGoToDashboard: () => void;
}

const Unauthorized = ({ onGoToDashboard }: UnauthorizedProps) => {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#FAF8F5", fontFamily: "Nunito, sans-serif" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-md text-white"
        style={{ backgroundColor: "#7CAE8E" }}
      >
        <ShieldX className="w-10 h-10" aria-hidden="true" />
      </div>

      <h1 className="text-6xl mb-3" style={{ color: "#2D4739" }}>
        403
      </h1>
      <h2 className="mb-3" style={{ color: "#374151" }}>
        Access Denied
      </h2>
      <p className="text-sm max-w-xs mb-8" style={{ color: "#6B7280" }}>
        You do not have permission to view this page. Return to your dashboard
        to continue.
      </p>

      <div className="text-5xl mb-8" aria-hidden="true">
        🔒
      </div>

      <button
        type="button"
        onClick={onGoToDashboard}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#7CAE8E" }}
      >
        <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
        Back to Dashboard
      </button>
    </main>
  );
};

export default Unauthorized;
