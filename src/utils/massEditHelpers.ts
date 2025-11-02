import { Alert } from "react-native";
import { supabase } from "../backend/supabaseClient";

export const fetchTrials = async () => {
  const { data, error } = await supabase
    .from("trials")
    .select("id, name, trial_phase");
  if (error) Alert.alert("Error fetching trials", error.message);
  return data || [];
};

export const fetchAppointmentsByTrial = async (trialId: string) => {
  try {
    const { data: patientTrials, error: ptError } = await supabase
      .from("patient_trials")
      .select("id")
      .eq("trial_id", trialId);

    if (ptError) throw ptError;
    if (!patientTrials?.length) return [];

    const patientTrialIds = patientTrials.map((pt) => pt.id);

    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("id, title, category, location, requirements, patient_trial_id")
      .in("patient_trial_id", patientTrialIds);

    if (apptError) throw apptError;
    if (!appointments?.length) return [];

    const unique = Object.values(
      appointments.reduce((acc, appt) => {
        if (!acc[appt.title]) acc[appt.title] = appt;
        return acc;
      }, {} as Record<string, any>)
    );

    return unique;
  } catch (err: any) {
    Alert.alert("Error fetching appointments", err.message);
    return [];
  }
};

export const fetchTrialMedications = async (trialId: string) => {
  try {
    const { data: patientTrials, error: ptError } = await supabase
      .from("patient_trials")
      .select("id")
      .eq("trial_id", trialId);
    if (ptError) throw ptError;
    if (!patientTrials?.length) return [];

    const patientTrialIds = patientTrials.map((pt) => pt.id);
    const { data: meds, error: medError } = await supabase
      .from("trial_medications")
      .select("id, name, frequency, notes, patient_trial_id")
      .in("patient_trial_id", patientTrialIds);

    if (medError) throw medError;
    if (!meds?.length) return [];

    const unique = Object.values(
      meds.reduce((acc, med) => {
        if (!acc[med.name]) acc[med.name] = med;
        return acc;
      }, {} as Record<string, any>)
    );
    return unique;
  } catch (err: any) {
    Alert.alert("Error fetching medications", err.message);
    return [];
  }
};

export const updateAllAppointments = async (
  trialId: string,
  apptTitle: string,
  field: string,
  newValue: any
) => {
  const { data: patientTrials, error: ptError } = await supabase
    .from("patient_trials")
    .select("id")
    .eq("trial_id", trialId);
  if (ptError) throw ptError;
  if (!patientTrials || patientTrials.length === 0) return;
  const patientTrialIds = patientTrials.map((pt) => pt.id);

  const { error } = await supabase
    .from("appointments")
    .update({ [field]: newValue })
    .in("patient_trial_id", patientTrialIds)
    .eq("title", apptTitle);
  if (error) throw error;
};

export const updateAllMedications = async (
  trialId: string,
  medName: string,
  field: string,
  newValue: string
) => {
  const { data: patientTrials, error: ptError } = await supabase
    .from("patient_trials")
    .select("id")
    .eq("trial_id", trialId);
  if (ptError) throw ptError;
  if (!patientTrials || patientTrials.length === 0) return;
  const patientTrialIds = patientTrials.map((pt) => pt.id);
  const { error } = await supabase
    .from("trial_medications")
    .update({ [field]: newValue })
    .in("patient_trial_id", patientTrialIds)
    .eq("name", medName);
  if (error) throw error;
};

export const deleteAllAppointments = async (
  trialId: string,
  apptTitle: string
) => {
  const { data: patientTrials } = await supabase
    .from("patient_trials")
    .select("id")
    .eq("trial_id", trialId);
  if (!patientTrials || patientTrials.length === 0) return;
  const patientTrialIds = patientTrials.map((pt) => pt.id);

  await supabase
    .from("appointments")
    .delete()
    .in("patient_trial_id", patientTrialIds)
    .eq("title", apptTitle);
};

export const deleteAllMedications = async (
  trialId: string,
  medName: string
) => {
  const { data: patientTrials } = await supabase
    .from("patient_trials")
    .select("id")
    .eq("trial_id", trialId);
  if (!patientTrials || patientTrials.length === 0) return;
  const patientTrialIds = patientTrials.map((pt) => pt.id);

  await supabase
    .from("trial_medications")
    .delete()
    .in("patient_trial_id", patientTrialIds)
    .eq("name", medName);
};
