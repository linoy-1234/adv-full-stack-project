import { Link } from 'react-router-dom';

/**
 * LandingPage
 * Public entry screen shown before authentication.
 * Calm, minimal: brand, one-line description, and two clear actions.
 */
function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">

        {/* Brand logo: leaf in a sage rounded square */}
        <div className="w-20 h-20 rounded-card bg-sage flex items-center justify-center shadow-card mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 8-4 16-9 16Z" />
            <path d="M5 19c4-6 8-8 12-9" />
          </svg>
        </div>

        {/* Brand name */}
        <h1 className="font-display text-4xl text-sage-deep mb-1">
          Onco<span className="text-sage">+</span>Log
        </h1>
        <p className="text-sage-deep/60 text-base mb-10">
          Your supportive treatment companion
        </p>

        {/* Short description */}
        <p className="text-sage-deep/70 leading-relaxed mb-10 max-w-sm">
          A calm, clear space to follow your treatment journey — your daily plan,
          blood results, side-effect journal, and a direct line to your care team.
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Link to="/login" className="oc-btn-primary w-full text-center">
            Log In
          </Link>
          <Link to="/register" className="oc-btn-secondary w-full text-center">
            New Patient? Register
          </Link>
        </div>

        <p className="text-sage-deep/40 text-xs mt-10">
          For medical emergencies, always call your clinic or local emergency number.
        </p>
      </div>
    </div>
  );
}

export default LandingPage;