export type Phase = {
  id: string;
  name: string;
  startDay?: number | null;
  endDay?: number | null;
};

export type Assessment = {
  id: string;
  name: string;
  category: string;
  scheduledDays: string[];
  applicableCycles: number[];
  requirements?: string;
  fasting_required?: boolean;
  applicablePhases?: string[]; 
  frequencyPattern?: string;
  notes?: string;
};

export type TrialMedication = {
  id: string;
  drug_name: string;
  frequency?: string;
  scheduled_days: string[];
  applicableCycles: number[];
  specialConditions?: string;
  isOptional?: boolean;
  optionalCategory?: string | null;
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
  assessments: Assessment[];
  medications: TrialMedication[];
  notes?: string;
  version?: number;
  created_by?: string | null;
  created_at?: string;
};
