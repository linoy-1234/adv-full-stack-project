import { useState } from 'react';
import { ArrowLeft, Leaf, CheckCircle } from 'lucide-react';
import { validateRegistration } from '../../components/mockData';
import { RibbonBackground } from '../../components/shared/RibbonBackground';

interface RegisterPageProps {
  onBack: () => void;
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const valid = validateRegistration(form.nationalId);
    setLoading(false);

    if (!valid) {
      setError(
        'This National ID was not found in the hospital registry, or is already registered. Please contact your medical coordinator.'
      );
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif', position: 'relative' }}
      >
        <RibbonBackground />
        <div className="w-full max-w-md rounded-3xl shadow-lg p-10 flex flex-col items-center gap-5 text-center bg-white">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: '#7CAE8E' }} />
          </div>
          <h2 style={{ color: '#2D4739' }}>Registration Successful! 🌿</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Your account has been created. Welcome to Onco+Log. You can now sign in with your National ID and password.
          </p>
          <button
            onClick={onBack}
            className="px-8 py-3 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif', position: 'relative' }}
    >
      <RibbonBackground />
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: '#7CAE8E' }}
        >
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl" style={{ color: '#2D4739' }}>
          Onco<span style={{ color: '#7CAE8E' }}>+</span>Log
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Patient Registration</p>
      </div>

      <div className="w-full max-w-md rounded-3xl shadow-lg p-8 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: '#7CAE8E' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="mb-5 p-3.5 rounded-2xl text-xs" style={{ backgroundColor: '#FFF7ED', color: '#92400E' }}>
          <strong>Note:</strong> Your National ID (ת.ז.) must exist in our hospital registry. If you haven't been pre-registered by your medical team, please contact your oncology coordinator.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Full Name</label>
            <input
              type="text"
              placeholder="As it appears on your ID"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', fontFamily: 'Nunito, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>
              National ID Number (ת.ז.)
            </label>
            <input
              type="text"
              placeholder="111222333"
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', fontFamily: 'Nunito, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Birth Date</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', fontFamily: 'Nunito, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Create Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', fontFamily: 'Nunito, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', fontFamily: 'Nunito, sans-serif' }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
            style={{ backgroundColor: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
          >
            {loading ? '🌿 Verifying with hospital registry...' : 'Create My Account'}
          </button>

          <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: '#F0FAF4', color: '#4B7A5E' }}>
            Demo: Use ID <strong>111222333</strong> — this ID exists in the hospital registry but is not yet registered.
          </div>
        </form>
      </div>
    </div>
  );
}
