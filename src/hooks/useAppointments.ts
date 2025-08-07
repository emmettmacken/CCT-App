import { useEffect, useState } from 'react';
import { supabase } from '../../backend/supabaseClient';
import { Appointment, Patient } from '../types/clinCalendar';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          id, patient_id, patients:patient_id(name), date, time, type, status, notes
        `)
        .order('date', { ascending: true });

      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name')
        .order('name', { ascending: true });

      setAppointments(
        appointmentsData?.map(a => ({
          ...a,
          patient_name: a.patients?.[0]?.name || 'Unknown',
        })) || []
      );
      setPatients(patientsData || []);
    } catch (e) {
      console.error('Error fetching appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sub = supabase
      .channel('appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  return { appointments, patients, loading };
};
