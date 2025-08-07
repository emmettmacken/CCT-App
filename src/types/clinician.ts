export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Alert {
  id: string;
  type: 'patient_message' | 'medication_alert' | 'appointment_change';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  patient_id?: string;
  appointment_id?: string;
}