import { useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { RibbonBackground } from '../../components/common/RibbonBackground';
import ErrorMessage from '../../components/common/ErrorMessage';
import FieldError from '../../components/common/FieldError';
import { focusFirstField } from '../../utils/focusFirstField';

interface RegisterPageProps {
  onRegister: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<string | null> | string | null;
  onBack: () => void;
  onBackToHome?: () => void;
}

export function RegisterPage({ onRegister, onBack, onBackToHome }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: typeof fieldErrors = {};
    if (!normalizedEmail) nextErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.';
    else if (password.length > 100)
      nextErrors.password = 'Password cannot exceed 100 characters.';
    if (!confirmPassword)
      nextErrors.confirmPassword = 'Confirm password is required.';
    else if (password !== confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.email ? emailRef : { current: null },
        nextErrors.password ? passwordRef : { current: null },
        nextErrors.confirmPassword ? confirmPasswordRef : { current: null },
      ]);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const err = await onRegister(
        email.trim().toLowerCase(),
        password,
        confirmPassword
      );

      if (err) setError(err);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: '#FAF8F5', position: 'relative' }}>
      <RibbonBackground />
      {onBackToHome && (
        <button onClick={onBackToHome} className="absolute top-6 left-6 flex items-center gap-1.5 text-sm hover:opacity-70 z-10" style={{ color: "#7CAE8E" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      )}

      <div className="flex flex-col items-center gap-2 mb-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md text-white font-bold text-3xl" style={{ backgroundColor: '#7CAE8E' }}>
          +
        </div>
        <h1 className="text-3xl" style={{ color: '#2D4739' }}>Onco<span style={{ color: '#7CAE8E' }}>+</span>Log</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Patient Registration</p>
      </div>

      <div className="w-full max-w-md rounded-3xl shadow-lg p-8 bg-white relative z-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70" style={{ color: '#7CAE8E' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="mb-5 p-3.5 rounded-2xl text-xs" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          <strong>How registration works:</strong> Your oncologist must first create your medical profile in the system using your email address. Enter that email below to activate your patient account.
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Email Address *</label>
            <input
              ref={emailRef}
              type="email"
              placeholder="The email your oncologist registered you with"
              value={email}
              onChange={(e) => {
                setFieldErrors((current) => ({ ...current, email: undefined }));
                setEmail(e.target.value);
              }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: `2px solid ${fieldErrors.email ? '#F87171' : '#E5E7EB'}` }}
              onFocus={(e) => (e.target.style.borderColor = fieldErrors.email ? '#F87171' : '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = fieldErrors.email ? '#F87171' : '#E5E7EB')}
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Create Password *</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => {
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                  setPassword(e.target.value);
                }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                style={{ backgroundColor: '#F9FAFB', border: `2px solid ${fieldErrors.password ? '#F87171' : '#E5E7EB'}` }}
                onFocus={(e) => (e.target.style.borderColor = fieldErrors.password ? '#F87171' : '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = fieldErrors.password ? '#F87171' : '#E5E7EB')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.password} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Confirm Password *</label>
            <input
              ref={confirmPasswordRef}
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => {
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                setConfirmPassword(e.target.value);
              }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: `2px solid ${fieldErrors.confirmPassword ? '#F87171' : '#E5E7EB'}` }}
              onFocus={(e) => (e.target.style.borderColor = fieldErrors.confirmPassword ? '#F87171' : '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = fieldErrors.confirmPassword ? '#F87171' : '#E5E7EB')}
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </div>

          {error && <ErrorMessage message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-60 mt-1"
            style={{ backgroundColor: '#7CAE8E' }}
          >
            {loading ? '🌿 Verifying...' : 'Activate My Account'}
          </button>
        </form>

      </div>
    </div>
  );
}
