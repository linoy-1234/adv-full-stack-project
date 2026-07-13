import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Home,
  Info,
  Pencil,
  Pill,
  Scissors,
  Stethoscope,
  Syringe,
  Zap,
} from "lucide-react";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { MessagesPanel } from "../../../components/shared/MessagesPanel";
import { ClinicalDocumentsPanel } from "../../../components/shared/ClinicalDocumentsPanel";
import { SymptomJournalPanel } from "../../../components/shared/SymptomJournalPanel";

import { RibbonBackground } from "../../../components/shared/RibbonBackground";
import { useErrorVisibility } from "../../../hooks/useErrorVisibility";
import { shiftDate } from "../../../utils/dateUtils";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getRadiationDisplayStatus,
  getSurgeryDisplayStatus,
  toDateInputValue,
  todayIso,
  weekdayKeys,
  type ChemoDisplayStatus,
  type RadiationDisplayStatus,
  type SurgeryDisplayStatus,
  type WeekdayKey,
} from "../../../utils/treatmentDisplay";
import { getPatientLabs } from "../../../services/labService";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  clearPatientsError,
  editPatient,
  fetchPatientById,
} from "../../../store/slices/patientsSlice";
import {
  approveCycle,
  bulkUpdateCycles,
  createCycle,
  createProtocol,
  deleteCycle,
  getPatientProtocol,
  postponeCycle,
  updateCycle,
  updateProtocol,
  type CyclePayload,
  type MedicationPayload,
  type ProtocolPayload,
} from "../../../services/treatmentService";
import type { PatientPayload } from "../../../services/patientService";
import type {
  ApiLabResult,
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
  TreatmentCycleRecord,
  TreatmentCycleStatus,
  TreatmentKind,
  TreatmentMedicationCategory,
  TreatmentMedicationRecord,
  TreatmentProtocolRecord,
  TreatmentProtocolResponse,
  TreatmentTypeRecord,
} from "../../../types/api";
import type {
  ModalName,
  MedicationFormRecord,
  ProtocolFormResult,
} from "./types";
import {
  buildInitialCycles,
  getAllergyNames,
  getApiErrorMessage,
  getMedicationPlan,
  getOncologistName,
  makeGeneratedCycle,
  medicationToPayload,
  sortCycles,
  toCyclePayload,
} from "./helpers";
import { PatientMedicalProfileCard } from "./components/cards/PatientMedicalProfileCard";
import { MedicationPlanCard } from "./components/cards/MedicationPlanCard";
import { TreatmentProtocolCard } from "./components/cards/TreatmentProtocolCard";
import { TreatmentRoadmapCard } from "./components/cards/TreatmentRoadmapCard";
import { LabResultsCard } from "./components/cards/LabResultsCard";
import { EditProfileModal } from "./components/modals/EditProfileModal";
import { EditMedicationsModal } from "./components/modals/EditMedicationsModal";
import { EditProtocolModal } from "./components/modals/EditProtocolModal";
import { EditTreatmentDatesModal } from "./components/modals/EditTreatmentDatesModal";
import { PostponeCycleModal } from "./components/modals/PostponeCycleModal";

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onHome: () => void;
}


export function PatientDetail({ patientId, onBack, onHome }: PatientDetailProps) {
  const dispatch = useAppDispatch();
  const {
    selectedPatient,
    loading,
    error: patientsError,
  } = useAppSelector((state) => state.patients);
  const [modal, setModal] = useState<ModalName>(null);
  const [protocol, setProtocol] = useState<TreatmentProtocolRecord | null>(null);
  const [cycles, setCycles] = useState<TreatmentCycleRecord[]>([]);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState("");
  const [savingTreatment, setSavingTreatment] = useState(false);
  const treatmentErrorRef = useErrorVisibility(treatmentError);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [cycleToPostpone, setCycleToPostpone] = useState<TreatmentCycleRecord | null>(null);

  const [labResults, setLabResults] = useState<ApiLabResult[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labHistoryExpanded, setLabHistoryExpanded] = useState(false);

  useEffect(() => {
    dispatch(clearPatientsError());
    dispatch(fetchPatientById(patientId));
  }, [dispatch, patientId]);

  useEffect(() => {
    setLabsLoading(true);
    getPatientLabs(patientId)
      .then((res) => setLabResults(res.labResults))
      .catch(() => setLabResults([]))
      .finally(() => setLabsLoading(false));
  }, [patientId]);

  const applyTreatmentResponse = (response: TreatmentProtocolResponse) => {
    setProtocol(response.protocol || null);
    setCycles(sortCycles(response.cycles || []));
  };

  const refreshTreatment = async () => {
    setTreatmentLoading(true);
    setTreatmentError("");

    try {
      const response = await getPatientProtocol(patientId);
      applyTreatmentResponse(response);
    } catch (error) {
      const maybeResponse = error as { response?: { status?: number } };
      if (maybeResponse.response?.status === 404) {
        setProtocol(null);
        setCycles([]);
      } else {
        setTreatmentError(
          getApiErrorMessage(error, "Failed to load treatment protocol")
        );
      }
    } finally {
      setTreatmentLoading(false);
    }
  };

  useEffect(() => {
    void refreshTreatment();
  }, [patientId]);

  const profile =
    selectedPatient && selectedPatient._id === patientId ? selectedPatient : null;
  const allergies = getAllergyNames(profile?.allergies);

  const medicationPlan = useMemo(() => getMedicationPlan(protocol), [protocol]);
  const chemoCycles = cycles.filter((cycle) => cycle.treatmentType === "chemotherapy");
  const radiationCycles = cycles.filter((cycle) => cycle.treatmentType === "radiation");
  const surgeryCycles = cycles.filter((cycle) => cycle.treatmentType === "surgery");
  const hasCycles = cycles.length > 0;

  const handleSaveProfile = async (
    patientData: Partial<PatientPayload>
  ): Promise<string | null> => {
    try {
      await dispatch(editPatient({ patientId, patientData })).unwrap();
      return null;
    } catch (error) {
      return typeof error === "string" ? error : "Failed to update patient";
    }
  };

  const handleSaveMedications = async (medications: MedicationFormRecord[]) => {
    if (!protocol) {
      throw new Error("Create a treatment protocol before saving medications");
    }

    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const payloadMedications = medications
        .filter((medication) => medication.name.trim())
        .map(medicationToPayload);
      const response = await updateProtocol(protocol._id, {
        medications: payloadMedications,
        drugs: payloadMedications
          .filter((medication) => medication.category === "chemotherapy")
          .map((medication) => medication.name),
      });
      applyTreatmentResponse(response);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to save medications");
      setTreatmentError(message);
      throw new Error(message);
    } finally {
      setSavingTreatment(false);
    }
  };

  const syncCyclesToProtocol = async (
    protocolId: string,
    result: ProtocolFormResult,
    currentCycles: TreatmentCycleRecord[]
  ) => {
    const targetChemo =
      result.treatmentTypes.find((entry) => entry.type === "chemotherapy")?.plannedCount || 0;
    const targetRadiation =
      result.treatmentTypes.find((entry) => entry.type === "radiation")?.plannedCount || 0;
    const targetSurgery =
      result.treatmentTypes.find((entry) => entry.type === "surgery")?.plannedCount || 0;
    const existingChemo = currentCycles.filter(
      (cycle) => cycle.treatmentType === "chemotherapy"
    );
    const existingRadiation = currentCycles.filter(
      (cycle) => cycle.treatmentType === "radiation"
    );
    const existingSurgery = currentCycles.filter(
      (cycle) => cycle.treatmentType === "surgery"
    );

    for (const cycle of existingChemo.slice(targetChemo)) {
      await deleteCycle(cycle._id);
    }

    let chemoReferenceEnd =
      targetChemo > 0 && existingChemo.length > 0
        ? toDateInputValue(existingChemo[Math.min(existingChemo.length, targetChemo) - 1].endDate)
        : "";

    for (let index = existingChemo.length; index < targetChemo; index += 1) {
      const startDate = chemoReferenceEnd ? shiftDate(chemoReferenceEnd, 1) : todayIso();
      const endDate = shiftDate(startDate, 20);
      chemoReferenceEnd = endDate;
      await createCycle(
        protocolId,
        makeGeneratedCycle("chemotherapy", index + 1, `Cycle ${index + 1}`, startDate, endDate)
      );
    }

    if (targetRadiation > 0) {
      if (existingRadiation.length > 0) {
        const [firstRadiation, ...extraRadiation] = existingRadiation;
        await updateCycle(firstRadiation._id, {
          totalSessions: targetRadiation,
          completedSessions: firstRadiation.completedSessions || 0,
        });
        for (const cycle of extraRadiation) await deleteCycle(cycle._id);
      } else {
        const startDate =
          targetChemo > 0 && chemoReferenceEnd
            ? shiftDate(chemoReferenceEnd, 7)
            : todayIso();
        const endDate = shiftDate(startDate, Math.max(1, Math.ceil((targetRadiation * 7) / 5)));
        await createCycle(
          protocolId,
          makeGeneratedCycle("radiation", 1, "Radiation Course", startDate, endDate, {
            totalSessions: targetRadiation,
            completedSessions: 0,
          })
        );
      }
    } else {
      for (const cycle of existingRadiation) await deleteCycle(cycle._id);
    }

    for (const cycle of existingSurgery.slice(targetSurgery)) {
      await deleteCycle(cycle._id);
    }
    for (let index = existingSurgery.length; index < targetSurgery; index += 1) {
      const plannedDate = shiftDate(todayIso(), 30 + index * 14);
      await createCycle(
        protocolId,
        makeGeneratedCycle(
          "surgery",
          index + 1,
          `Surgery Checkpoint ${index + 1}`,
          plannedDate,
          plannedDate,
          { plannedDate }
        )
      );
    }
  };

  const handleSaveProtocol = async (result: ProtocolFormResult) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      if (!protocol) {
        const payload: ProtocolPayload = {
          protocolName: result.protocolName,
          diagnosis: result.diagnosis,
          treatmentTypes: result.treatmentTypes,
          medications: [],
          drugs: result.drugs,
          notes: result.notes,
          cycles: buildInitialCycles(result),
        };
        const response = await createProtocol(patientId, payload);
        applyTreatmentResponse(response);
        return;
      }

      const response = await updateProtocol(protocol._id, {
        protocolName: result.protocolName,
        diagnosis: result.diagnosis,
        treatmentTypes: result.treatmentTypes,
        drugs: result.drugs,
        notes: result.notes,
      });
      applyTreatmentResponse(response);
      await syncCyclesToProtocol(protocol._id, result, response.cycles || cycles);
      await refreshTreatment();
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to save protocol"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleSaveDates = async (
    updatedCycles: TreatmentCycleRecord[],
    removedCycleIds: string[]
  ) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      if (!protocol) {
        throw new Error("Create a treatment protocol before saving treatment dates");
      }

      const payloadCycles = updatedCycles.map((cycle) => {
        const payload = toCyclePayload(cycle);
        if (cycle.treatmentType === "surgery") {
          payload.plannedDate = toDateInputValue(cycle.plannedDate || cycle.startDate);
          payload.startDate = payload.plannedDate;
          payload.endDate = payload.plannedDate;
        }
        return { _id: cycle._id, ...payload };
      });

      const response = await bulkUpdateCycles(protocol._id, {
        cycles: payloadCycles,
        removedCycleIds,
      });
      applyTreatmentResponse(response);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to save treatment dates");
      setTreatmentError(message);
      throw new Error(message);
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleApprove = async (cycle: TreatmentCycleRecord) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const response = await approveCycle(cycle._id);
      applyTreatmentResponse(response);
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to approve cycle"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const handlePostpone = async (
    cycle: TreatmentCycleRecord,
    newStartDate: string,
    newEndDate: string
  ) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const response = await postponeCycle(cycle._id, {
        newStartDate,
        newEndDate,
      });
      applyTreatmentResponse(response);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to postpone cycle");
      setTreatmentError(message);
      throw new Error(message);
    } finally {
      setSavingTreatment(false);
    }
  };

  const headerTitle = profile?.fullName || "Patient Detail";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2C3E2D] transition-colors"
            >
              <ArrowLeft size={15} /> Directory
            </button>
            <span className="text-[#E5E2DC]">-</span>
            <h1 className="text-sm font-semibold text-[#2C3E2D]">
              {headerTitle}
            </h1>
            {allergies.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertTriangle size={10} /> Allergies
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9CA3AF]">
              {profile ? getOncologistName(profile) : "Oncologist"}
            </span>
            <button onClick={onHome} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <Home size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5 relative z-10">
        {!profile && (
          <PatientMedicalProfileCard
            profile={profile}
            loading={loading}
            patientsError={patientsError}
            allergies={allergies}
            onDismissError={() => dispatch(clearPatientsError())}
            onEditClick={() => setModal("profile")}
          />
        )}

        {profile && (
          <>
            {patientsError && (
              <ErrorMessage
                message={patientsError}
                onDismiss={() => dispatch(clearPatientsError())}
              />
            )}

            {treatmentError && (
              <div ref={treatmentErrorRef}>
                <ErrorMessage
                  message={treatmentError}
                  onDismiss={() => setTreatmentError("")}
                />
              </div>
            )}

            <PatientMedicalProfileCard
              profile={profile}
              loading={loading}
              patientsError={patientsError}
              allergies={allergies}
              onDismissError={() => dispatch(clearPatientsError())}
              onEditClick={() => setModal("profile")}
            />

            <MedicationPlanCard
              protocol={protocol}
              treatmentLoading={treatmentLoading}
              medicationPlan={medicationPlan}
              savingTreatment={savingTreatment}
              onEditClick={() => setModal("medications")}
            />

            <TreatmentProtocolCard
              protocol={protocol}
              treatmentLoading={treatmentLoading}
              savingTreatment={savingTreatment}
              onEditClick={() => setModal("protocol")}
            />

            <TreatmentRoadmapCard
              protocol={protocol}
              treatmentLoading={treatmentLoading}
              hasCycles={hasCycles}
              chemoCycles={chemoCycles}
              radiationCycles={radiationCycles}
              surgeryCycles={surgeryCycles}
              expandedCycle={expandedCycle}
              onToggleExpand={(cycleId) =>
                setExpandedCycle(expandedCycle === cycleId ? null : cycleId)
              }
              savingTreatment={savingTreatment}
              onApprove={handleApprove}
              onRequestPostpone={(cycle) => setCycleToPostpone(cycle)}
              onEditDatesClick={() => setModal("dates")}
            />

            <LabResultsCard
              labsLoading={labsLoading}
              labResults={labResults}
              labHistoryExpanded={labHistoryExpanded}
              onToggleLabHistory={() => setLabHistoryExpanded((v) => !v)}
            />

            <MessagesPanel patientId={patientId} />

            <ClinicalDocumentsPanel patientId={patientId} canManage={true} />

            <SymptomJournalPanel patientId={patientId} />
          </>
        )}
      </main>

      {modal === "profile" && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setModal(null)}
          onSave={handleSaveProfile}
        />
      )}
      {modal === "medications" && protocol && (
        <EditMedicationsModal
          medications={medicationPlan}
          onClose={() => setModal(null)}
          onSave={handleSaveMedications}
        />
      )}
      {modal === "protocol" && profile && (
        <EditProtocolModal
          protocol={protocol}
          profileDiagnosis={profile.diagnosis}
          onClose={() => setModal(null)}
          onSave={handleSaveProtocol}
        />
      )}
      {modal === "dates" && (
        <EditTreatmentDatesModal
          cycles={cycles}
          onClose={() => setModal(null)}
          onSave={handleSaveDates}
        />
      )}
      {cycleToPostpone && (
        <PostponeCycleModal
          cycle={cycleToPostpone}
          onClose={() => setCycleToPostpone(null)}
          onConfirm={(newStartDate, newEndDate) =>
            handlePostpone(cycleToPostpone, newStartDate, newEndDate)
          }
        />
      )}
    </div>
  );
}

