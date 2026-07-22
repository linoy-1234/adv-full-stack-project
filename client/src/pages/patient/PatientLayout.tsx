import { useState, useEffect } from "react";
import { LogOut, Home, BookOpen, Calendar, MessageCircle, UserCircle, Menu, X, ArrowLeft, FlaskConical } from "lucide-react";
import { PatientNavPage } from "../../App";
import { RibbonBackground } from "../../components/shared/RibbonBackground";

interface NavItem {
  page: PatientNavPage;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { page: "patient-dashboard",   label: "Home",               icon: <Home className="w-5 h-5" /> },
  { page: "patient-cycles",      label: "Treatment Roadmap",  icon: <Calendar className="w-5 h-5" /> },
  { page: "patient-bloodwork",   label: "Blood Work",         icon: <FlaskConical className="w-5 h-5" /> },
  { page: "patient-journal",     label: "Symptom Journal",    icon: <BookOpen className="w-5 h-5" /> },
  { page: "patient-messages",    label: "Messages & Documents", icon: <MessageCircle className="w-5 h-5" /> },
  { page: "patient-profile",     label: "My Profile",         icon: <UserCircle className="w-5 h-5" /> },
];

interface PatientLayoutProps {
  patientName: string;
  patientId: string;
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: PatientNavPage) => void;
  onLogout: () => void;
  onBack?: () => void;
  unreadMessages?: number;
}

export function PatientLayout({ patientName, patientId, children, currentPage, onNavigate, onLogout, onBack, unreadMessages = 0 }: PatientLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleNav = (page: PatientNavPage) => {
    setDrawerOpen(false);
    onNavigate(page);
  };

  const pageLabel = NAV_ITEMS.find((n) => n.page === currentPage)?.label ?? "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF8F5", position: "relative" }}>
      <RibbonBackground />

      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.35)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Side drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "280px",
          zIndex: 55, backgroundColor: "#FFFFFF",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.14)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "#7CAE8E" }}>
              +
            </div>
            <span style={{ color: "#2D4739" }} className="text-sm">Onco<span style={{ color: "#7CAE8E" }}>+</span>Log</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: "#9CA3AF" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3" style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#F9FAFB" }}>
          <p className="text-sm" style={{ color: "#374151" }}>{patientName}</p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Patient Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all"
                style={{
                  backgroundColor: isActive ? "#F0FAF4" : "transparent",
                  color: isActive ? "#166534" : "#374151",
                  borderLeft: `3px solid ${isActive ? "#7CAE8E" : "transparent"}`,
                }}
              >
                <span style={{ color: isActive ? "#7CAE8E" : "#9CA3AF" }}>{item.icon}</span>
                <span className="text-sm flex-1">{item.label}</span>
                {item.page === "patient-messages" && unreadMessages > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                    style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                  >
                    {unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={() => { setDrawerOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
            style={{ color: "#EF4444" }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </div>

      {/* Top header */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: "rgba(250,248,245,0.96)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-1 shrink-0">
            {onBack && currentPage !== "patient-dashboard" ? (
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-colors hover:bg-gray-100"
                style={{ color: "#2D4739", backgroundColor: "#F0FAF4", border: "1.5px solid #A7F3D0" }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button onClick={() => handleNav("patient-dashboard")} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "#7CAE8E" }}>
                  +
                </div>
                <span style={{ color: "#2D4739" }} className="text-sm">Onco<span style={{ color: "#7CAE8E" }}>+</span>Log</span>
              </button>
            )}
          </div>
          <span className="text-sm absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ color: "#6B7280" }}>{pageLabel}</span>
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0" style={{ color: "#6B7280" }}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 relative z-10">
        {children}
      </main>
    </div>
  );
}
