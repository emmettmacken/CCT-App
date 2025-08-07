// hooks/useMedications.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../backend/supabaseClient';
import { Medication, MedicationLog, AdditionalMedication } from '../types/medications';

export const useMedications = () => {
  const [trialMedications, setTrialMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [additionalMeds, setAdditionalMeds] = useState<AdditionalMedication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const [trialMeds, logs, extraMeds] = await Promise.all([
          supabase.from('medications').select('*').eq('patient_trial_id', user.id),
          supabase.from('medications').select('*').eq('patient_id', user.id).order('taken_at', { ascending: false }),
          supabase.from('additional_medications').select('*').eq('patient_id', user.id).order('taken_at', { ascending: false }),
        ]);

        setTrialMedications(trialMeds.data || []);
        setMedicationLogs(logs.data || []);
        setAdditionalMeds(extraMeds.data || []);
      } catch (error) {
        console.error('Error fetching medications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    trialMedications,
    medicationLogs,
    additionalMeds,
    loading,
    setTrialMedications,
    setMedicationLogs,
    setAdditionalMeds,
  };
};
