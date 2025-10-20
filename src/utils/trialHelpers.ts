import { Assessment, TrialMedication } from "../types/admin";

export const createNewAssessment = (): Assessment => ({
  id: Math.random().toString(36).substring(2, 9),
  name: "",
  category: "Clinical Exam",
  scheduledDays: [],
  applicableCycles: [],
  requirements: "",
  fasting_required: false,
});

export const createNewMedication = (): TrialMedication => ({
  id: Math.random().toString(36).substring(2, 9),
  drug_name: "",
  frequency: "",
  scheduled_days: [],
  applicableCycles: [],
  specialConditions: "",
});

export const validateAssessment = (a: Partial<Assessment>): boolean =>
  !!(a.name && a.category);

export const validateMedication = (m: Partial<TrialMedication>): boolean =>
  !!m.drug_name;

export const normalizeDayTokens = (cycleDurationDays: string): string[] => {
  const days = parseInt(cycleDurationDays, 10) || 0;
  return Array.from({ length: days }, (_, i) => `d${i + 1}`);
};

export const normalizeCycles = (numberOfCycles: string): number[] => {
  const n = parseInt(numberOfCycles, 10) || 0;
  return Array.from({ length: n }, (_, i) => i + 1);
};

export const confirmRequired = (name: string, version: string): boolean =>
  !!(name.trim() && version.trim());
