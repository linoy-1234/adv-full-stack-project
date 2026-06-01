import { useState } from 'react';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { validatePatientLogin, validateOncologistLogin, Patient, Oncologist } from '../mockData';
import { RibbonBackground } from '../shared/RibbonBackground';

interface LoginPageProps {
  onPatientLogin: (patient: Patient) => void;
  onOncologistLogin: (oncologist: Oncologist) => void;
  onGoToRegister: () => void;
}

export function LoginPage({ onPatientLogin, onOncologistLogin, onGoToRegister }: LoginPageProps) {
  const [tab, setTab] = useState<'patient' | 'oncologist'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [patientForm, setPatientForm] = useState({ fullName: '', nationalId: '', password: '' });
  const [oncoForm, setOncoForm] = useState({ fullName: '', email: '', password: '' });

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const patient = validatePatientLogin(patientForm.fullName, patientForm.nationalId, patientForm.password);
    setLoading(false);
    if (!patient) {
      setError('No matching patient record found. Please check your details.');
      return;
    }
    onPatientLogin(patient);
  };

  const handleOncoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const onco = validateOncologistLogin(oncoForm.fullName, oncoForm.email, oncoForm.password);
    setLoading(false);
    if (!onco) {
      setError('Credentials not recognised. Please contact your system administrator.');
      return;
    }
    onOncologistLogin(onco);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif', position: 'relative' }}
    >
      <RibbonBackground />
      {/* Logo / Header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: '#7CAE8E' }}
        >
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl" style={{ color: '#2D4739', fontFamily: 'Nunito, sans-serif' }}>
          Onco<span style={{ color: '#7CAE8E' }}>+</span>Log
        </h1>
        <p className="text-sm text-center" style={{ color: '#6B7280' }}>
          Your supportive treatment companion
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl shadow-lg p-8"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Tab Selector */}
        <div
          className="flex rounded-2xl p-1 mb-7"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          {(['patient', 'oncologist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: tab === t ? '#7CAE8E' : 'transparent',
                color: tab === t ? '#FFFFFF' : '#6B7280',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {t === 'patient' ? '🌸 Patient' : '🩺 Oncologist'}
            </button>
          ))}
        </div>

        {/* Patient Form */}
        {tab === 'patient' && (
          <form onSubmit={handlePatientSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Cohen"
                value={patientForm.fullName}
                onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 border-transparent transition-all"
                style={{
                  backgroundColor: '#F9FAFB',
                  fontFamily: 'Nunito, sans-serif',
                  border: '2px solid #E5E7EB',
                }}
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
                placeholder="123456789"
                value={patientForm.nationalId}
                onChange={(e) => setPatientForm({ ...patientForm, nationalId: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: '#F9FAFB',
                  fontFamily: 'Nunito, sans-serif',
                  border: '2px solid #E5E7EB',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={patientForm.password}
                  onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                  style={{
                    backgroundColor: '#F9FAFB',
                    fontFamily: 'Nunito, sans-serif',
                    border: '2px solid #E5E7EB',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-center rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ backgroundColor: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? '🌿 Verifying...' : '🔒 Patient Secure Login'}
            </button>

            {/* Demo hint */}
            <div className="mt-1 p-3 rounded-xl text-xs" style={{ backgroundColor: '#F0FAF4', color: '#4B7A5E' }}>
              <span className="block">Demo: Name <strong>Sarah Cohen</strong>, ID <strong>123456789</strong>, Password <strong>patient123</strong></span>
            </div>
          </form>
        )}

        {/* Oncologist Form */}
        {tab === 'oncologist' && (
          <form onSubmit={handleOncoSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Miriam Goldstein"
                value={oncoForm.fullName}
                onChange={(e) => setOncoForm({ ...oncoForm, fullName: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: '#F9FAFB', fontFamily: 'Nunito, sans-serif', border: '2px solid #E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Gmail Address</label>
              <input
                type="email"
                placeholder="doctor@gmail.com"
                value={oncoForm.email}
                onChange={(e) => setOncoForm({ ...oncoForm, email: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: '#F9FAFB', fontFamily: 'Nunito, sans-serif', border: '2px solid #E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={oncoForm.password}
                  onChange={(e) => setOncoForm({ ...oncoForm, password: e.target.value })}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-12"
                  style={{ backgroundColor: '#F9FAFB', fontFamily: 'Nunito, sans-serif', border: '2px solid #E5E7EB' }}
                  onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-center rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ backgroundColor: '#2D4739', fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? '🌿 Verifying...' : '🩺 Medical Staff Login'}
            </button>

            <div className="mt-1 p-3 rounded-xl text-xs" style={{ backgroundColor: '#F0FAF4', color: '#4B7A5E' }}>
              <span className="block">Demo: Name <strong>Dr. Miriam Goldstein</strong>, Gmail <strong>miriam.goldstein@gmail.com</strong>, Password <strong>doctor123</strong></span>
            </div>
          </form>
        )}
      </div>

      {/* Footer Link */}
      <button
        onClick={onGoToRegister}
        className="mt-6 text-sm underline underline-offset-2 transition-opacity hover:opacity-70"
        style={{ color: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
      >
        New Patient? Click here to register
      </button>
    </div>
  );
}
