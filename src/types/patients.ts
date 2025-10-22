export interface Patient {
  trial_id: string;
  height: ReactNode;
  weight: ReactNode;
  id: string;
  name: string;
  age: number;
  trial_name: string;
  trial_phase: string;
  trial_progress: number;
}

export interface Appointment {
  fasting_required: boolean;
  requirements: any;
  category: string;
  location: any;
  title: any;
  id: string;
  date: string;
  time: string;
  type: string;
  status: 'completed' | 'missed' | 'upcoming';
  notes?: string;
}

export interface Medication {
  scheduled_date: string;
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