import { LogIn, UserPlus, Calendar, FlaskConical, MessageCircle, BookOpen } from 'lucide-react';
import { RibbonBackground } from '../../components/shared/RibbonBackground';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export function LandingPage({ onGoToLogin, onGoToRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F5', position: 'relative' }}>
      <RibbonBackground />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm text-white font-bold text-lg" style={{ backgroundColor: '#7CAE8E' }}>
            +
          </div>
          <h1 className="text-2xl" style={{ color: '#2D4739' }}>
            Onco<span style={{ color: '#7CAE8E' }}>+</span>Log
          </h1>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full flex flex-col items-center text-center gap-8">

          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto text-sm" style={{ backgroundColor: '#D1FAE5', border: '1.5px solid #7CAE8E', color: '#166534' }}>
              Cancer Treatment Coordination Portal
            </div>
            <h2 className="text-3xl md:text-4xl" style={{ color: '#2D4739', lineHeight: '1.2' }}>
              Welcome to Onco+Log
            </h2>
            <p className="text-base md:text-lg" style={{ color: '#6B7280', lineHeight: '1.6' }}>
              A coordination portal for cancer patients, oncologists, and lab staff.
              Organized access to treatment schedules, lab results, and care team communication — all in one place.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {[
              { icon: <Calendar className="w-5 h-5" />, label: "Treatment Roadmap", color: '#D1FAE5' },
              { icon: <FlaskConical className="w-5 h-5" />, label: "Lab Results", color: '#FEE2E2' },
              { icon: <MessageCircle className="w-5 h-5" />, label: "Care Team Messages", color: '#DBEAFE' },
              { icon: <BookOpen className="w-5 h-5" />, label: "Symptom Journal", color: '#FEF3C7' },
            ].map(({ icon, label, color }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB' }}>
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: color, color: '#2D4739' }}>
                  {icon}
                </div>
                <p className="text-xs" style={{ color: '#374151' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-left">
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#2D4739' }}>Patients</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>View your treatment schedule, track symptoms, check lab results, and message your oncologist.</p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#2D4739' }}>Oncologists</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Manage patient profiles, design treatment protocols, review lab results, and coordinate care.</p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#2D4739' }}>Lab Staff</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Enter and update independent blood work records for each patient.</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={onGoToLogin}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white text-base transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#7CAE8E' }}
            >
              <LogIn className="w-5 h-5" />
              Log In
            </button>
            <button
              onClick={onGoToRegister}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base transition-all hover:shadow-md"
              style={{ backgroundColor: '#FFFFFF', border: '2px solid #7CAE8E', color: '#7CAE8E' }}
            >
              <UserPlus className="w-5 h-5" />
              Patient Registration
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-5 text-center">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          © 2026 Onco+Log — Cancer treatment coordination for patients and care teams.
        </p>
      </footer>
    </div>
  );
}
