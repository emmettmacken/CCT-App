export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  last_appointment: string;
  alerts: number;
}

export interface Appointment {
  id: string;
  date: string;
  type: string;
  status: 'completed' | 'missed' | 'upcoming';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface ClinicianNote {
  id: string;
  created_at: string;
  content: string;
  author: string;
}

export interface Alert {
  id: string;
  type: 'fasting' | 'allergy' | 'precaution';
  message: string;
  active: boolean;
}