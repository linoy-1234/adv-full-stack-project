export interface Medication {
  name: string;
  dose: string;
  times: string[];
  type: 'chemo' | 'antiemetic' | 'supportive';
  route: 'IV' | 'oral';
}

export interface LabResult {
  date: string;
  wbc: number;
  neutrophils: number;
  hemoglobin: number;
  platelets: number;
  alt: number;
  creatinine: number;
  bloodPressure: string;
  weight: number;
  temperature: number;
}

export interface TreatmentCycle {
  id: string;
  number: number;
  startDate: string;
  endDate: string;
  approvalStatus: 'approved' | 'pending' | 'held';
  heldNotes?: string;
  delayedTo?: string;
  drugs: string[];
}

export interface RadiationDayLog {
  date: string;
  temperature: number | null;
  sessionStatus: 'completed' | 'fever-postponed' | 'cleared-no-session' | 'scheduled';
}

export interface RadiationPhase {
  id: string;
  label: string;
  targetArea: string;
  totalSessions: number;
  completedSessions: number;
  plannedStartDate: string;
  plannedEndDate: string;
  currentEndDate: string;
  skipWeekdays: number[]; // JS getDay() indices — 5=Fri, 6=Sat
  status: 'planned' | 'active' | 'completed';
  dailyLogs: RadiationDayLog[];
}

export interface SurgeryCheckpoint {
  id: string;
  date: string;
  procedureType: string;
  surgeon?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface SymptomEntry {
  id: string;
  date: string;
  time: string;
  nausea: number;
  fatigue: number;
  pain: number;
  vomiting: number;
  appetiteLoss: number;
  mouthSores: number;
  notes: string;
}

export interface Patient {
  id: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  diagnosis: string;
  bloodType: string;
  allergies: string[];
  oncologistId: string;
  medications: Medication[];
  cycles: TreatmentCycle[];
  labResults: LabResult[];
  symptomLog: SymptomEntry[];
  correlationInsights: string[];
  radiationPhases: RadiationPhase[];
  surgeries: SurgeryCheckpoint[];
}

export interface Oncologist {
  id: string;
  fullName: string;
  email: string;
  department: string;
}

export const TODAY = '2026-05-18';

export const hospitalPatientIds = ['123456789', '987654321', '456789123', '111222333', '234567890', '567890123'];

export const oncologists: Oncologist[] = [
  { id: 'onco1', fullName: 'Dr. Miriam Goldstein', email: 'miriam.goldstein@gmail.com', department: 'Oncology' },
];

export const patients: Patient[] = [
  {
    id: 'p1',
    fullName: 'Sarah Cohen',
    nationalId: '123456789',
    birthDate: '1978-04-15',
    diagnosis: 'Breast Cancer — Stage II (HER2+)',
    bloodType: 'A+',
    allergies: ['Penicillin', 'Codeine'],
    oncologistId: 'onco1',
    medications: [
      { name: 'Doxorubicin', dose: '60 mg/m²', times: ['08:00'], type: 'chemo', route: 'IV' },
      { name: 'Cyclophosphamide', dose: '600 mg/m²', times: ['08:00'], type: 'chemo', route: 'IV' },
      { name: 'Ondansetron', dose: '8 mg', times: ['08:00', '14:00', '22:00'], type: 'antiemetic', route: 'oral' },
      { name: 'Dexamethasone', dose: '12 mg', times: ['08:00'], type: 'supportive', route: 'oral' },
    ],
    cycles: [
      { id: 'c1', number: 1, startDate: '2026-02-03', endDate: '2026-02-10', approvalStatus: 'approved', drugs: ['Doxorubicin', 'Cyclophosphamide'] },
      { id: 'c2', number: 2, startDate: '2026-03-03', endDate: '2026-03-10', approvalStatus: 'approved', drugs: ['Doxorubicin', 'Cyclophosphamide'] },
      { id: 'c3', number: 3, startDate: '2026-04-01', endDate: '2026-04-08', approvalStatus: 'approved', drugs: ['Doxorubicin', 'Cyclophosphamide'] },
      { id: 'c4', number: 4, startDate: '2026-05-13', endDate: '2026-05-20', approvalStatus: 'approved', drugs: ['Doxorubicin', 'Cyclophosphamide'] },
      { id: 'c5', number: 5, startDate: '2026-06-10', endDate: '2026-06-17', approvalStatus: 'pending', drugs: ['Doxorubicin', 'Cyclophosphamide'] },
    ],
    labResults: [
      { date: '2026-02-03', wbc: 5.2, neutrophils: 2.8, hemoglobin: 12.4, platelets: 210, alt: 28, creatinine: 0.9, bloodPressure: '118/76', weight: 68.5, temperature: 36.8 },
      { date: '2026-03-03', wbc: 4.1, neutrophils: 2.1, hemoglobin: 11.8, platelets: 185, alt: 32, creatinine: 0.9, bloodPressure: '122/78', weight: 67.2, temperature: 36.6 },
      { date: '2026-04-01', wbc: 3.8, neutrophils: 1.9, hemoglobin: 11.2, platelets: 172, alt: 35, creatinine: 1.0, bloodPressure: '125/82', weight: 66.0, temperature: 37.0 },
      { date: '2026-05-13', wbc: 3.2, neutrophils: 1.6, hemoglobin: 10.8, platelets: 160, alt: 38, creatinine: 1.0, bloodPressure: '128/84', weight: 65.3, temperature: 37.2 },
    ],
    symptomLog: [
      { id: 's1', date: '2026-05-14', time: '10:00', nausea: 7, fatigue: 6, pain: 3, vomiting: 4, appetiteLoss: 6, mouthSores: 2, notes: 'Nausea peaked in the morning after medication.' },
      { id: 's2', date: '2026-05-15', time: '09:00', nausea: 5, fatigue: 7, pain: 2, vomiting: 2, appetiteLoss: 5, mouthSores: 3, notes: 'Feeling better overall, fatigue persists.' },
      { id: 's3', date: '2026-05-16', time: '14:00', nausea: 4, fatigue: 8, pain: 2, vomiting: 1, appetiteLoss: 4, mouthSores: 3, notes: '' },
    ],
    correlationInsights: [
      'System mapping indicates an 80% correlation between your Nausea severity peaks and Doxorubicin administration windows.',
      'Fatigue levels show a consistent 72% elevation pattern on Days 2–4 post-treatment initiation.',
    ],
    radiationPhases: [],
    surgeries: [],
  },

  {
    id: 'p2',
    fullName: 'David Levi',
    nationalId: '987654321',
    birthDate: '1965-09-22',
    diagnosis: 'Non-Small Cell Lung Cancer — Stage III',
    bloodType: 'O-',
    allergies: [],
    oncologistId: 'onco1',
    medications: [
      { name: 'Carboplatin', dose: 'AUC 6', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Paclitaxel', dose: '200 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Ondansetron', dose: '8 mg', times: ['09:00', '17:00'], type: 'antiemetic', route: 'oral' },
      { name: 'Lorazepam', dose: '1 mg', times: ['21:00'], type: 'supportive', route: 'oral' },
    ],
    cycles: [
      { id: 'dc1', number: 1, startDate: '2026-03-10', endDate: '2026-03-17', approvalStatus: 'approved', drugs: ['Carboplatin', 'Paclitaxel'] },
      { id: 'dc2', number: 2, startDate: '2026-04-07', endDate: '2026-04-14', approvalStatus: 'approved', drugs: ['Carboplatin', 'Paclitaxel'] },
      { id: 'dc3', number: 3, startDate: '2026-05-05', endDate: '2026-05-12', approvalStatus: 'approved', drugs: ['Carboplatin', 'Paclitaxel'] },
      { id: 'dc4', number: 4, startDate: '2026-06-02', endDate: '2026-06-09', approvalStatus: 'pending', drugs: ['Carboplatin', 'Paclitaxel'] },
    ],
    labResults: [
      { date: '2026-03-10', wbc: 6.1, neutrophils: 3.4, hemoglobin: 13.2, platelets: 245, alt: 25, creatinine: 1.1, bloodPressure: '132/84', weight: 84.0, temperature: 36.7 },
      { date: '2026-04-07', wbc: 4.8, neutrophils: 2.6, hemoglobin: 12.6, platelets: 210, alt: 30, creatinine: 1.1, bloodPressure: '135/86', weight: 83.1, temperature: 36.9 },
      { date: '2026-05-05', wbc: 3.5, neutrophils: 1.8, hemoglobin: 11.9, platelets: 180, alt: 34, creatinine: 1.2, bloodPressure: '138/88', weight: 82.4, temperature: 37.1 },
    ],
    symptomLog: [
      { id: 'ds1', date: '2026-05-06', time: '11:00', nausea: 5, fatigue: 7, pain: 4, vomiting: 3, appetiteLoss: 5, mouthSores: 1, notes: 'Joint pain from Paclitaxel.' },
      { id: 'ds2', date: '2026-05-09', time: '09:00', nausea: 3, fatigue: 8, pain: 5, vomiting: 1, appetiteLoss: 4, mouthSores: 1, notes: '' },
    ],
    correlationInsights: [
      'System mapping indicates a 74% correlation between Pain intensity peaks and Paclitaxel infusion days.',
      'Fatigue shows sustained elevation (avg 7.2/10) throughout treatment windows.',
    ],
    // Concurrent chemoradiation completed alongside chemo cycles 1–3
    radiationPhases: [
      {
        id: 'rp2-1',
        label: 'Concurrent Chemoradiation (CRT)',
        targetArea: 'Right Lung Hilum / Mediastinal Nodes',
        totalSessions: 30,
        completedSessions: 30,
        plannedStartDate: '2026-03-10',
        plannedEndDate: '2026-04-24',
        currentEndDate: '2026-04-24',
        skipWeekdays: [5, 6],
        status: 'completed',
        dailyLogs: [],
      },
    ],
    surgeries: [],
  },

  {
    id: 'p3',
    fullName: 'Rachel Mizrahi',
    nationalId: '456789123',
    birthDate: '1982-12-03',
    diagnosis: 'Colorectal Cancer — Stage II',
    bloodType: 'B+',
    allergies: ['Aspirin', 'NSAIDs', 'Ibuprofen'],
    oncologistId: 'onco1',
    medications: [
      { name: 'Oxaliplatin', dose: '85 mg/m²', times: ['10:00'], type: 'chemo', route: 'IV' },
      { name: 'Leucovorin', dose: '400 mg/m²', times: ['10:00'], type: 'supportive', route: 'IV' },
      { name: '5-Fluorouracil', dose: '400 mg/m²', times: ['10:00'], type: 'chemo', route: 'IV' },
      { name: 'Metoclopramide', dose: '10 mg', times: ['08:00', '14:00', '20:00'], type: 'antiemetic', route: 'oral' },
    ],
    cycles: [
      { id: 'rc1', number: 1, startDate: '2026-04-15', endDate: '2026-04-22', approvalStatus: 'approved', drugs: ['Oxaliplatin', 'Leucovorin', '5-Fluorouracil'] },
      { id: 'rc2', number: 2, startDate: '2026-05-13', endDate: '2026-05-20', approvalStatus: 'held', heldNotes: 'CBC values below safe threshold for administration. Scheduling repeat evaluation in one month; continue supportive medications in the interim.', delayedTo: '2026-05-18', drugs: ['Oxaliplatin', 'Leucovorin', '5-Fluorouracil'] },
      { id: 'rc3', number: 3, startDate: '2026-07-01', endDate: '2026-07-08', approvalStatus: 'pending', drugs: ['Oxaliplatin', 'Leucovorin', '5-Fluorouracil'] },
    ],
    labResults: [
      { date: '2026-04-15', wbc: 4.5, neutrophils: 2.3, hemoglobin: 12.0, platelets: 195, alt: 22, creatinine: 0.8, bloodPressure: '114/72', weight: 61.5, temperature: 36.5 },
      { date: '2026-05-18', wbc: 2.8, neutrophils: 1.1, hemoglobin: 10.5, platelets: 142, alt: 40, creatinine: 0.9, bloodPressure: '110/70', weight: 60.2, temperature: 37.4 },
    ],
    symptomLog: [
      { id: 'rs1', date: '2026-04-17', time: '12:00', nausea: 6, fatigue: 5, pain: 3, vomiting: 4, appetiteLoss: 5, mouthSores: 4, notes: 'Tingling sensation in hands and feet.' },
      { id: 'rs2', date: '2026-04-20', time: '10:00', nausea: 4, fatigue: 6, pain: 2, vomiting: 2, appetiteLoss: 4, mouthSores: 5, notes: 'Mouth sores worsening.' },
    ],
    correlationInsights: [
      'System mapping indicates an 85% correlation between Mouth Sores severity and 5-Fluorouracil administration cycles.',
      'Nausea patterns show 78% elevation within the first 6 hours of Oxaliplatin infusion.',
    ],
    radiationPhases: [],
    surgeries: [
      {
        id: 'sg3-1',
        date: '2026-02-14',
        procedureType: 'Laparoscopic Hemicolectomy (Right)',
        surgeon: 'Dr. Y. Cohen',
        notes: 'R0 resection achieved. 14 lymph nodes sampled; 2 involved. Recovery uneventful.',
        status: 'completed',
      },
    ],
  },

  {
    id: 'p4',
    fullName: 'Yael Shapiro',
    nationalId: '234567890',
    birthDate: '1990-03-20',
    diagnosis: 'Hodgkin\'s Lymphoma — Stage I',
    bloodType: 'AB+',
    allergies: [],
    oncologistId: 'onco1',
    medications: [
      { name: 'Doxorubicin', dose: '25 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Bleomycin', dose: '10 U/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Vinblastine', dose: '6 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Dacarbazine', dose: '375 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Ondansetron', dose: '8 mg', times: ['09:00', '17:00'], type: 'antiemetic', route: 'oral' },
      { name: 'Dexamethasone', dose: '8 mg', times: ['09:00'], type: 'supportive', route: 'oral' },
    ],
    cycles: [
      { id: 'yc1', number: 1, startDate: '2026-05-18', endDate: '2026-05-25', approvalStatus: 'pending', drugs: ['Doxorubicin', 'Bleomycin', 'Vinblastine', 'Dacarbazine'] },
      { id: 'yc2', number: 2, startDate: '2026-06-15', endDate: '2026-06-22', approvalStatus: 'pending', drugs: ['Doxorubicin', 'Bleomycin', 'Vinblastine', 'Dacarbazine'] },
    ],
    labResults: [
      { date: '2026-05-10', wbc: 5.8, neutrophils: 3.2, hemoglobin: 13.5, platelets: 220, alt: 24, creatinine: 0.85, bloodPressure: '118/74', weight: 58.0, temperature: 36.7 },
    ],
    symptomLog: [],
    correlationInsights: [],
    radiationPhases: [],
    surgeries: [],
  },

  {
    id: 'p5',
    fullName: 'Tamar Katz',
    nationalId: '567890123',
    birthDate: '1979-11-05',
    diagnosis: 'Breast Cancer — Triple Negative, Stage IIB',
    bloodType: 'O+',
    allergies: ['Penicillin'],
    oncologistId: 'onco1',
    medications: [
      { name: 'Epirubicin', dose: '90 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Cyclophosphamide', dose: '600 mg/m²', times: ['09:00'], type: 'chemo', route: 'IV' },
      { name: 'Ondansetron', dose: '8 mg', times: ['08:00', '20:00'], type: 'antiemetic', route: 'oral' },
      { name: 'Dexamethasone', dose: '8 mg', times: ['08:00'], type: 'supportive', route: 'oral' },
    ],
    cycles: [
      { id: 'tc1', number: 1, startDate: '2026-04-14', endDate: '2026-04-21', approvalStatus: 'approved', drugs: ['Epirubicin', 'Cyclophosphamide'] },
      { id: 'tc2', number: 2, startDate: '2026-05-18', endDate: '2026-05-25', approvalStatus: 'pending', drugs: ['Epirubicin', 'Cyclophosphamide'] },
      { id: 'tc3', number: 3, startDate: '2026-06-15', endDate: '2026-06-22', approvalStatus: 'pending', drugs: ['Epirubicin', 'Cyclophosphamide'] },
      { id: 'tc4', number: 4, startDate: '2026-07-13', endDate: '2026-07-20', approvalStatus: 'pending', drugs: ['Epirubicin', 'Cyclophosphamide'] },
    ],
    labResults: [
      { date: '2026-04-14', wbc: 6.3, neutrophils: 3.9, hemoglobin: 13.6, platelets: 242, alt: 21, creatinine: 0.78, bloodPressure: '116/74', weight: 72.5, temperature: 36.5 },
      { date: '2026-05-18', wbc: 5.1, neutrophils: 2.8, hemoglobin: 12.8, platelets: 204, alt: 26, creatinine: 0.82, bloodPressure: '120/76', weight: 71.8, temperature: 36.6 },
    ],
    symptomLog: [
      { id: 'ts1', date: '2026-04-17', time: '10:30', nausea: 6, fatigue: 7, pain: 2, vomiting: 3, appetiteLoss: 5, mouthSores: 1, notes: 'Nausea peaked on Day 3. Epirubicin hit harder than expected.' },
      { id: 'ts2', date: '2026-04-19', time: '09:00', nausea: 3, fatigue: 6, pain: 1, vomiting: 1, appetiteLoss: 4, mouthSores: 2, notes: 'Improving. Still fatigued but eating better.' },
    ],
    correlationInsights: [
      'System mapping indicates a 77% correlation between Nausea severity peaks and Epirubicin administration days.',
      'Fatigue levels show consistent elevation on Days 2–5 post-treatment.',
    ],
    // Active adjuvant radiation phase (concurrent with chemo cycle 2 window)
    // Sessions run Sun–Thu (skip Fri=5, Sat=6). Started May 4.
    // Fever logged May 17 → recovery check today (May 18).
    radiationPhases: [
      {
        id: 'rp5-1',
        label: 'Adjuvant Radiation Therapy',
        targetArea: 'Left Breast / Axillary Nodes',
        totalSessions: 28,
        completedSessions: 9,
        plannedStartDate: '2026-05-04',
        plannedEndDate: '2026-06-10',
        currentEndDate: '2026-06-11', // pushed +1 day by May 17 fever postponement
        skipWeekdays: [5, 6],         // skip Friday and Saturday
        status: 'active',
        dailyLogs: [
          { date: '2026-05-04', temperature: 36.7, sessionStatus: 'completed' },
          { date: '2026-05-05', temperature: 36.5, sessionStatus: 'completed' },
          { date: '2026-05-06', temperature: 36.8, sessionStatus: 'completed' },
          { date: '2026-05-07', temperature: 36.6, sessionStatus: 'completed' },
          // May 8 (Fri), May 9 (Sat): skip
          { date: '2026-05-10', temperature: 36.9, sessionStatus: 'completed' },
          { date: '2026-05-11', temperature: 37.0, sessionStatus: 'completed' },
          { date: '2026-05-12', temperature: 36.8, sessionStatus: 'completed' },
          { date: '2026-05-13', temperature: 36.7, sessionStatus: 'completed' },
          { date: '2026-05-14', temperature: 36.6, sessionStatus: 'completed' },
          // May 15 (Fri), May 16 (Sat): skip
          { date: '2026-05-17', temperature: 38.3, sessionStatus: 'fever-postponed' }, // fever yesterday
          // May 18 (today): no log yet → recovery check required
        ],
      },
    ],
    surgeries: [
      {
        id: 'sg5-1',
        date: '2026-03-02',
        procedureType: 'Lumpectomy + Sentinel Node Biopsy',
        surgeon: 'Dr. A. Ben-David',
        notes: 'Clean surgical margins achieved. 2 of 4 sentinel nodes positive. Port-a-cath placed.',
        status: 'completed',
      },
    ],
  },
];

// ─── Utility helpers ───────────────────────────────────────────────────────────

export type CycleStatus = 'past' | 'active' | 'future' | 'held';

export function getCycleStatus(cycle: TreatmentCycle, today = TODAY): CycleStatus {
  if (cycle.approvalStatus === 'held') return 'held';
  if (cycle.endDate < today) return 'past';
  if (cycle.approvalStatus === 'approved' && cycle.startDate <= today && cycle.endDate >= today) return 'active';
  return 'future';
}

export function getDayOfCycle(cycle: TreatmentCycle, today = TODAY): number {
  const start = new Date(cycle.startDate);
  const now = new Date(today);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function isPredictedSafe(labResults: LabResult[]): boolean {
  if (labResults.length === 0) return false;
  const latest = labResults[labResults.length - 1];
  return latest.wbc >= 3.0 && latest.neutrophils >= 1.5;
}

export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export const LAB_NORMS: Record<string, { label: string; min: number; max: number; unit: string }> = {
  wbc: { label: 'WBC', min: 4.5, max: 11.0, unit: 'K/µL' },
  neutrophils: { label: 'Neutrophils', min: 1.8, max: 7.7, unit: 'K/µL' },
  hemoglobin: { label: 'Hemoglobin', min: 12.0, max: 17.0, unit: 'g/dL' },
  platelets: { label: 'Platelets', min: 150, max: 400, unit: 'K/µL' },
  alt: { label: 'ALT (Liver)', min: 7, max: 56, unit: 'U/L' },
  creatinine: { label: 'Creatinine (Kidney)', min: 0.6, max: 1.2, unit: 'mg/dL' },
};

export function getLabStatus(key: string, value: number): 'normal' | 'low' | 'high' {
  const norm = LAB_NORMS[key];
  if (!norm) return 'normal';
  if (value < norm.min) return 'low';
  if (value > norm.max) return 'high';
  return 'normal';
}

export function getBPStatus(bp: string): 'normal' | 'elevated' | 'high' {
  const parts = bp.split('/').map(Number);
  if (parts.length < 2) return 'normal';
  const [sys, dia] = parts;
  if (sys > 180 || dia > 120) return 'high';
  if (sys > 140 || dia > 90) return 'elevated';
  return 'normal';
}

export function getTempStatus(temp: number): 'normal' | 'low' | 'high' {
  if (temp < 36.1) return 'low';
  if (temp > 37.5) return 'high';
  return 'normal';
}

// ─── Radiation helpers ─────────────────────────────────────────────────────────

export type RadiationTodayType =
  | 'skip-day'
  | 'needs-temp-morning'
  | 'needs-temp-recovery'
  | 'fever-active'
  | 'cleared-no-session'
  | 'session-ok'
  | 'session-done'
  | 'phase-complete'
  | 'no-active-phase';

export interface RadiationTodayState {
  type: RadiationTodayType;
  loggedTemp?: number;
  sessionNumber?: number;
  phase: RadiationPhase;
}

function countCompletedSessions(phase: RadiationPhase, beforeDate: string): number {
  return phase.dailyLogs.filter(
    (l) => l.date < beforeDate && l.sessionStatus === 'completed'
  ).length;
}

function getMostRecentLogBefore(phase: RadiationPhase, date: string): RadiationDayLog | null {
  const logs = phase.dailyLogs
    .filter((l) => l.date < date && l.temperature !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
  return logs[0] ?? null;
}

export function getRadiationTodayState(
  phase: RadiationPhase,
  today = TODAY,
  localTemp: number | null = null,
): RadiationTodayState {
  if (phase.status === 'completed') return { type: 'phase-complete', phase };
  if (phase.status === 'planned') return { type: 'no-active-phase', phase };

  const todayDow = new Date(today).getDay();
  const existingLog = phase.dailyLogs.find((l) => l.date === today);
  const effectiveTemp = localTemp ?? (existingLog?.temperature ?? null);

  // Temperature has been recorded (either locally or from stored logs)
  if (effectiveTemp !== null) {
    const prevLog = getMostRecentLogBefore(phase, today);
    const isRecoveryDay = prevLog?.sessionStatus === 'fever-postponed';

    if (effectiveTemp >= 38) {
      return { type: 'fever-active', loggedTemp: effectiveTemp, phase };
    }
    if (isRecoveryDay) {
      return { type: 'cleared-no-session', loggedTemp: effectiveTemp, phase };
    }
    if (existingLog?.sessionStatus === 'completed') {
      const sessionNum = countCompletedSessions(phase, today);
      return { type: 'session-done', sessionNumber: sessionNum, phase };
    }
    const sessionNum = countCompletedSessions(phase, today) + 1;
    return { type: 'session-ok', loggedTemp: effectiveTemp, sessionNumber: sessionNum, phase };
  }

  // Skip day (no temp needed)
  if (phase.skipWeekdays.includes(todayDow)) {
    return { type: 'skip-day', phase };
  }

  // No temp yet — determine which gate type to show
  const prevLog = getMostRecentLogBefore(phase, today);
  if (prevLog?.sessionStatus === 'fever-postponed') {
    return { type: 'needs-temp-recovery', phase };
  }

  const sessionNum = countCompletedSessions(phase, today) + 1;
  return { type: 'needs-temp-morning', sessionNumber: sessionNum, phase };
}

export function getCompletedSessionCount(phase: RadiationPhase): number {
  const fromLogs = phase.dailyLogs.filter((l) => l.sessionStatus === 'completed').length;
  return fromLogs > 0 ? fromLogs : phase.completedSessions;
}

export function hasFeverAlert(
  phase: RadiationPhase,
  today = TODAY,
): { hasFever: boolean; feverDate?: string; temp?: number } {
  for (let d = 0; d <= 2; d++) {
    const checkDate = shiftDate(today, -d);
    const log = phase.dailyLogs.find(
      (l) => l.date === checkDate && l.sessionStatus === 'fever-postponed',
    );
    if (log?.temperature != null) {
      return { hasFever: true, feverDate: checkDate, temp: log.temperature };
    }
  }
  return { hasFever: false };
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export function validatePatientLogin(fullName: string, nationalId: string, password: string): Patient | null {
  if (password !== 'patient123') return null;
  return patients.find(
    (p) => p.fullName.toLowerCase() === fullName.toLowerCase() && p.nationalId === nationalId
  ) || null;
}

export function validateOncologistLogin(fullName: string, email: string, password: string): Oncologist | null {
  if (password !== 'doctor123') return null;
  return oncologists.find(
    (o) => o.fullName.toLowerCase() === fullName.toLowerCase() && o.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

export function validateRegistration(nationalId: string): boolean {
  return hospitalPatientIds.includes(nationalId) && !patients.find((p) => p.nationalId === nationalId);
}

// ─── Clinical Communication ────────────────────────────────────────────────────

export interface ClinicalMessage {
  id: string;
  patientId: string;
  fromRole: 'patient' | 'oncologist';
  text: string;
  timestamp: string; // ISO datetime
}

export interface PhysicianNote {
  id: string;
  patientId: string;
  oncologistName: string;
  text: string;
  timestamp: string; // ISO datetime
}

export const seedMessages: ClinicalMessage[] = [
  {
    id: 'msg1',
    patientId: 'p1',
    fromRole: 'patient',
    text: "I've been feeling very nauseous after the last treatment. Is this intensity normal? It peaks around 4–6 hours after the infusion.",
    timestamp: '2026-05-14T10:32:00',
  },
  {
    id: 'msg2',
    patientId: 'p1',
    fromRole: 'oncologist',
    text: "Yes, nausea within 4–8 hours is a very common response to Doxorubicin — this is called acute nausea. Please take your Ondansetron 30 minutes before each meal. Try small, frequent meals and avoid strong smells. If the nausea becomes severe or you cannot keep fluids down, call the clinic immediately.",
    timestamp: '2026-05-14T14:15:00',
  },
  {
    id: 'msg3',
    patientId: 'p1',
    fromRole: 'patient',
    text: "Thank you for explaining. Are there any foods I should specifically avoid during this cycle?",
    timestamp: '2026-05-15T09:10:00',
  },
];

export const seedPhysicianNotes: PhysicianNote[] = [
  {
    id: 'pn1',
    patientId: 'p1',
    oncologistName: 'Dr. Miriam Goldstein',
    text: "Important: Please increase your fluid intake to at least 2 liters of water per day between cycles. Staying well-hydrated supports kidney function during chemotherapy and can help reduce nausea. Contact the clinic if you notice any changes in urination or unusual swelling.",
    timestamp: '2026-05-14T14:20:00',
  },
];
