import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { RibbonBackground } from "../../components/shared/RibbonBackground";

interface LoginPageProps {
  // Returns null on success, error string on failure
  onLogin: (
    email: string,
    password: string
  ) => Promise<string | null> | string | null;

  onGoToRegister: () => void;
  onBackToHome?: () => void;
}

export function LoginPage({
  onLogin,
  onGoToRegister,
  onBackToHome,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }

    return "Login failed. Please try again.";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const err = await onLogin(normalizedEmail, password);

      if (err) {
        setError(err);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#FAF8F5", position: "relative" }}
    >
      <RibbonBackground />

      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm hover:opacity-70 z-10"
          style={{ color: "#7CAE8E" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      )}

      <div className="flex flex-col items-center gap-2 mb-8 relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md text-white font-bold text-3xl"
          style={{ backgroundColor: "#7CAE8E" }}
        >
          +
        </div>

        <h1 className="text-3xl" style={{ color: "#2D4739" }}>
          Onco<span style={{ color: "#7CAE8E" }}>+</span>Log
        </h1>

        <p className="text-sm text-center" style={{ color: "#6B7280" }}>
          Cancer Treatment Coordination Portal
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl shadow-lg p-8 bg-white relative z-10">
        <h2
          className="text-base font-semibold text-center mb-6"
          style={{ color: "#2C3E2D" }}
        >
          Sign In
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm mb-1.5"
              style={{ color: "#374151" }}
            >
              Email Address
            </label>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "#F9FAFB",
                border: "2px solid #E5E7EB",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7CAE8E";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm mb-1.5"
              style={{ color: "#374151" }}
            >
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#7CAE8E";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9CA3AF" }}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="text-sm text-center rounded-xl px-4 py-2.5"
              style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-60 mt-1"
            style={{ backgroundColor: "#7CAE8E" }}
          >
            {loading ? "🌿 Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo credentials */}
        <div
          className="mt-5 p-4 rounded-2xl text-xs space-y-1.5"
          style={{
            backgroundColor: "#F0FAF4",
            border: "1.5px solid #A7F3D0",
          }}
        >
          <p className="font-semibold text-[#2D4739] mb-2">
            Demo Credentials
          </p>

          <p style={{ color: "#4B7A5E" }}>
            🌸 Patient: <strong>sarah.cohen@email.com</strong> /{" "}
            <strong>patient1</strong>
          </p>

          <p style={{ color: "#2D4739" }}>
            🩺 Oncologist: <strong>dr.goldstein@oncolog.com</strong> /{" "}
            <strong>onco123</strong>
          </p>

          <p style={{ color: "#2D4739" }}>
            🔬 Lab Staff: <strong>noa.lab@oncolog.com</strong> /{" "}
            <strong>lab123</strong>
          </p>
        </div>
      </div>

      <button
        onClick={onGoToRegister}
        className="mt-6 text-sm underline underline-offset-2 hover:opacity-70 relative z-10"
        style={{ color: "#7CAE8E" }}
      >
        New Patient? Register here
      </button>
    </div>
  );
}