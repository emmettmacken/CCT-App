export interface Medication {
  id: string;
  patient_trial_id: string;
  name: string;
  dosage: string;
  start_day: number | null;
  end_day: number | null;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  patient_id: string;
  taken_at: string;
  dosage: string;
  notes?: string;
}

export interface AdditionalMedication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  taken_at: string;
  reason?: string;
  side_effects?: string;
}