import { useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { RibbonBackground } from '../../components/shared/RibbonBackground';
import { focusFirstField, useErrorVisibility } from '../../hooks/useErrorVisibility';

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
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useErrorVisibility<HTMLParagraphElement>(error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) { setError('Please enter a valid email address.'); focusFirstField([emailRef]); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); focusFirstField([passwordRef]); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); focusFirstField([confirmPasswordRef]); return; }

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Email Address *</label>
            <input
              ref={emailRef}
              type="email"
              placeholder="The email your oncologist registered you with"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Create Password *</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Confirm Password *</label>
            <input
              ref={confirmPasswordRef}
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {error && (
            <p ref={errorRef} role="alert" className="text-sm rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-60 mt-1"
            style={{ backgroundColor: '#7CAE8E' }}
          >
            {loading ? '🌿 Verifying...' : 'Activate My Account'}
          </button>
        </form>

        <div className="mt-5 p-4 rounded-2xl text-xs space-y-1.5" style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #A7F3D0' }}>
          <p className="font-semibold text-[#2D4739] mb-2">Demo — pre-registered patients</p>
          <p style={{ color: '#4B7A5E' }}>🌸 <strong>sarah.cohen@email.com</strong> (account already active)</p>
          <p style={{ color: '#4B7A5E' }}>🌿 <strong>miriam.levi@email.com</strong> — profile exists, not yet registered</p>
        </div>
      </div>
    </div>
  );
}
