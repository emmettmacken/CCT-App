export interface Appointment {
  location: any;
  title: Title;
  id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}