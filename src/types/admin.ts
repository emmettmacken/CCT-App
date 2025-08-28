export type Phase = {
  id: string;
  name: string;
  startDay?: number | null;
  endDay?: number | null;
};

export type Marker = {
  id: string;
  label: string;
  referenceDay?: number | null; // optional mapping to a day in the cycle or null (e.g., Day 100 post-ASCT)
};

export type Assessment = {
  id: string;
  name: string;
  category: string;
  applicablePhases: string[]; // phase ids
  scheduledDays: Array<string>; // "d1", "d4", "marker:<markerId>"
  frequencyPattern?: string;
  notes?: string;
};

export type TrialMedication = {
  id: string;
  drugName: string;
  administrationPattern: Array<string>; // same format as scheduledDays
  cycleApplicability: string; // e.g., "1-2", "all"
  specialConditions?: string;
};

export type TrialTemplate = {
  id?: string;
  name: string;
  protocolVersion: string;
  trialPhase: string;
  numberOfCycles: number;
  cycleDurationDays: number;
  followUpDurationDays?: number;
  phases: Phase[];
  markers: Marker[];
  assessments: Assessment[];
  medications: TrialMedication[];
  notes?: string;
  version?: number;
  created_by?: string | null;
  created_at?: string;
};