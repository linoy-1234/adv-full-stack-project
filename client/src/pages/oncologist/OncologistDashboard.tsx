import { useEffect, useState } from "react";
import { AccountStatus } from "../../types/patientPortalTypes";
import { formatDate, TODAY } from "../../utils/dateUtils";
import { AddPatientModal } from "./dashboard/AddPatientModal";
import { useAuth } from "../../context/AuthContext";
import { getOncologistUnreadCounts } from "../../services/messageService";
import { RibbonBackground } from "../../components/shared/RibbonBackground";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addPatient,
  clearPatientsError,
  fetchPatients,
} from "../../store/slices/patientsSlice";
import type { PatientProfile as ApiPatientProfile, PendingAction } from "../../types/api";
import type { PatientPayload } from "../../services/patientService";
import {
  Users,
  Plus,
  LogOut,
  FlaskConical,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Stethoscope,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react";

interface OncologistDashboardProps {
  onSelectPatient: (id: string) => void;
  onLogout: () => void;
}

function PendingBadges({ actions }: { actions: PendingAction[] }) {
  const visibleActions = actions.filter((action) => action !== "none");
  if (visibleActions.length === 0) {
    return <span className="text-xs text-[#9CA3AF]">-</span>;
  }

  const cfg: Partial<Record<PendingAction, { label: string; color: string; icon: React.ReactNode }>> = {
    cycle_ready_review: { label: "Treatment review", color: "bg-violet-100 text-violet-700", icon: <CheckCircle2 size={11} /> },
    unread_message: { label: "Unread message", color: "bg-purple-100 text-purple-700", icon: <MessageSquare size={11} /> },
  };

  return (
    <div className="flex flex-wrap gap-1">
      {visibleActions.map((action) => {
        const item = cfg[action];
        if (!item) return null;

        return (
          <span key={action} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.color}`}>
            {item.icon}{item.label}
          </span>
        );
      })}
    </div>
  );
}

type AccountStatusLike =
  | AccountStatus
  | ApiPatientProfile["accountStatus"]
  | undefined;

function AccountBadge({ status }: { status: AccountStatusLike }) {
  if (status === "linked") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <UserCheck size={11} /> Linked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <UserX size={11} /> Awaiting registration
    </span>
  );
}

export function OncologistDashboard({ onSelectPatient, onLogout }: OncologistDashboardProps) {
  const { user: authUser } = useAuth();
  const dispatch = useAppDispatch();
  const {
    list: patients,
    loading,
    error: patientsError,
  } = useAppSelector((state) => state.patients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    getOncologistUnreadCounts()
      .then((res) => setUnreadCounts(res.counts))
      .catch(() => setUnreadCounts({}));
  }, []);

  const filtered = patients.filter((patient) => {
    const query = search.toLowerCase();

    return (
      patient.fullName.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient.diagnosis.toLowerCase().includes(query) ||
      patient.nationalId.toLowerCase().includes(query)
    );
  });

  const directoryError = actionError || patientsError;

  const handleCreatePatient = async (
    patientData: PatientPayload
  ): Promise<string | null> => {
    try {
      await dispatch(addPatient(patientData)).unwrap();
      setActionError("");
      return null;
    } catch (error) {
      return typeof error === "string" ? error : "Failed to create patient";
    }
  };

  const handleOpenPatient = (patient: ApiPatientProfile) => {
    setActionError("");
    onSelectPatient(patient._id);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7CAE8E]/20 flex items-center justify-center">
              <Stethoscope size={18} className="text-[#7CAE8E]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#2C3E2D]">Onco+Log</h1>
              <p className="text-xs text-[#9CA3AF]">{authUser?.fullName ?? "Oncologist"}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2C3E2D] flex items-center gap-2">
              <Users size={20} className="text-[#7CAE8E]" /> Patient Directory
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} under your care · {formatDate(TODAY)}
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors shadow-sm">
            <Plus size={15} /> Add Patient
          </button>
        </div>

        <div className="mb-4">
          <input
            className="w-full max-w-sm border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]"
            placeholder="Search by name, email, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {directoryError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>{directoryError}</span>
            <button
              type="button"
              onClick={() => {
                setActionError("");
                dispatch(clearPatientsError());
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E2DC] overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-4 px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
            <span>Patient</span>
            <span>Diagnosis</span>
            <span>Treatment Status</span>
            <span>Account</span>
            <span>Pending Action</span>
            <span></span>
          </div>

          {loading && patients.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#9CA3AF]">Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#9CA3AF]">No patients found.</div>
          ) : (
            filtered.map((profile) => {
              return (
                <div key={profile._id} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-4 px-5 py-4 border-b border-[#F5F2EE] last:border-0 hover:bg-[#FAF8F5] transition-colors items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#2C3E2D]">{profile.fullName}</p>
                      {(unreadCounts[profile._id] ?? 0) > 0 && (
                        <span
                          title={`${unreadCounts[profile._id]} unread message${unreadCounts[profile._id] === 1 ? "" : "s"}`}
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
                          style={{ backgroundColor: "#EF4444", color: "#ffffff" }}
                        >
                          {unreadCounts[profile._id]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{profile.email}</p>
                    {profile.nationalId && <p className="text-xs text-[#9CA3AF]">ID: {profile.nationalId}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-[#374151] leading-snug">{profile.diagnosis || "—"}</p>
                  </div>
                  <div>
                    {profile.treatmentSummary ? (
                      <>
                        <p className="text-sm font-medium text-[#374151] leading-snug">{profile.treatmentSummary.protocolName}</p>
                        {profile.treatmentSummary.treatmentTypes.length > 0 && (
                          <p className="text-xs text-[#9CA3AF]">
                            {profile.treatmentSummary.treatmentTypes
                              .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                              .join(" · ")}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-[#9CA3AF]">No active treatment protocol</p>
                    )}
                  </div>
                  <div>
                    <AccountBadge status={profile.accountStatus} />
                  </div>
                  <div>
                    <PendingBadges actions={profile.pendingActions ?? [profile.pendingAction ?? "none"]} />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => handleOpenPatient(profile)} className="flex items-center gap-0.5 text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium">
                      Open <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl border border-[#E5E2DC] flex flex-wrap gap-4 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#7CAE8E]" /> Today: <strong>{formatDate(TODAY)}</strong></span>
          <span className="flex items-center gap-1.5"><FlaskConical size={12} className="text-amber-500" /> Lab results entered by Lab Staff only</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Treatment decisions made by oncologist only</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-400" /> Patient profiles created and managed by oncologist</span>
        </div>
      </main>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreatePatient}
          oncologistName={authUser?.fullName ?? "Oncologist"}
        />
      )}
    </div>
  );
}


