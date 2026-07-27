import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { RibbonBackground } from "../../components/common/RibbonBackground";
import { GoogleAuthButton } from "./components/GoogleAuthButton";
import ErrorMessage from "../../components/common/ErrorMessage";
import FieldError from "../../components/common/FieldError";
import { focusFirstField } from "../../utils/focusFirstField";
import { getApiErrorMessage } from "../../utils/apiError";

interface LoginPageProps {
  // Returns null on success, error string on failure
  onLogin: (
    email: string,
    password: string
  ) => Promise<string | null> | string | null;
  onGoogleLogin: (
    credential: string
  ) => Promise<string | null> | string | null;

  onGoToRegister: () => void;
  onBackToHome?: () => void;
}

export function LoginPage({
  onLogin,
  onGoogleLogin,
  onGoToRegister,
  onBackToHome,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    const nextErrors: typeof fieldErrors = {};
    if (!normalizedEmail)
      nextErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 6)
      nextErrors.password = "Password must be at least 6 characters.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.email ? emailRef : { current: null },
        nextErrors.password ? passwordRef : { current: null },
      ]);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const err = await onLogin(normalizedEmail, password);

      if (err) {
        setError(err);
      }
    } catch (error) {
      setError(getApiErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError("");
    setLoading(true);

    try {
      const err = await onGoogleLogin(credential);

      if (err) {
        setError(err);
      }
    } catch (error) {
      setError(getApiErrorMessage(error, "Login failed. Please try again."));
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

        <div className="mb-4 flex justify-center">
          <GoogleAuthButton
            disabled={loading}
            onCredential={handleGoogleCredential}
            onError={setError}
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E5E7EB]" />
          <span className="text-xs text-[#9CA3AF]">or</span>
          <div className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm mb-1.5"
              style={{ color: "#374151" }}
            >
              Email Address *
            </label>

            <input
              ref={emailRef}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setFieldErrors((current) => ({ ...current, email: undefined }));
                setEmail(e.target.value);
              }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: "#F9FAFB",
                border: `2px solid ${
                  fieldErrors.email ? "#F87171" : "#E5E7EB"
                }`,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = fieldErrors.email
                  ? "#F87171"
                  : "#7CAE8E";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.email
                  ? "#F87171"
                  : "#E5E7EB";
              }}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <div>
            <label
              className="block text-sm mb-1.5"
              style={{ color: "#374151" }}
            >
              Password *
            </label>

            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                  setPassword(e.target.value);
                }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: `2px solid ${
                    fieldErrors.password ? "#F87171" : "#E5E7EB"
                  }`,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = fieldErrors.password
                    ? "#F87171"
                    : "#7CAE8E";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.password
                    ? "#F87171"
                    : "#E5E7EB";
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
            <FieldError message={fieldErrors.password} />
          </div>

          {error && <ErrorMessage message={error} />}

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
            <strong>123456</strong>
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
