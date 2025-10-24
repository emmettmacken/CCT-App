import { formatISO } from "date-fns";
import { supabase } from "../../backend/supabaseClient";
import { Assessment, TrialMedication } from "../types/admin";

export const fetchTrials = async (): Promise<{ id: string; name: string }[]> => {
  const { data, error } = await supabase
    .from("trials")
    .select("id, name")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching trials:", error);
    return [];
  }
  return data || [];
};

export const fetchTrialDetails = async (trialId: string) => {
  const { data: trial, error } = await supabase
    .from("trials")
    .select("*")
    .eq("id", trialId)
    .single();
  if (error) throw error;
  return trial;
};

export const fetchAssessments = async (trialId: string): Promise<Assessment[]> => {
  const { data, error } = await supabase
    .from("trial_assessments")
    .select("*")
    .eq("trial_id", trialId);
  if (error) throw error;
  return (
    data?.map((a) => ({
      ...a,
      scheduledDays: a.scheduled_days || [],
      applicableCycles: a.applicable_cycles || [],
      fasting_required: a.fasting_required || false,
    })) || []
  );
};

export const fetchMedications = async (trialId: string): Promise<TrialMedication[]> => {
  const { data: meds, error: medsError } = await supabase
    .from("trial_medications_template")
    .select("*")
    .eq("trial_id", trialId);

  const { data: optionalMeds, error: optError } = await supabase
    .from("trial_optional_medications")
    .select("*")
    .eq("trial_id", trialId);

  if (medsError) throw medsError;
  if (optError) throw optError;

  return [
    ...(meds?.map((m) => ({
      ...m,
      scheduled_days: m.scheduled_days || [],
      applicableCycles: m.applicable_cycles || [],
      isOptional: false,
    })) || []),
    ...(optionalMeds?.map((m) => ({
      ...m,
      scheduled_days: m.scheduled_days || [],
      applicableCycles: m.applicable_cycles || [],
      isOptional: true,
      optionalCategory: m.category,
    })) || []),
  ];
};

export const saveTrialToDB = async (
  trialData: any,
  assessments: Assessment[],
  medications: TrialMedication[],
  isUpdate: boolean,
  selectedTrialId: string | null
) => {
  const {
    name,
    protocolVersion,
    trialPhase,
    numberOfCycles,
    cycleDurationDays,
    notes,
  } = trialData;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdBy = user?.id ?? null;

  const numCycles = parseInt(numberOfCycles, 10) || 0;
  const cycleDays = parseInt(cycleDurationDays, 10) || 0;

  let trialId = selectedTrialId;

  if (isUpdate && selectedTrialId) {
    const { error } = await supabase
      .from("trials")
      .update({
        name: name.trim(),
        protocol_version: protocolVersion.trim(),
        trial_phase: trialPhase,
        number_of_cycles: numCycles,
        cycle_duration_days: cycleDays,
        notes: notes?.trim() || null,
      })
      .eq("id", selectedTrialId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("trials")
      .insert([
        {
          name: name.trim(),
          protocol_version: protocolVersion.trim(),
          trial_phase: trialPhase,
          number_of_cycles: numCycles,
          cycle_duration_days: cycleDays,
          notes: notes?.trim() || null,
          created_by: createdBy,
          created_at: formatISO(new Date()),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    trialId = data.id;
  }

  if (isUpdate && selectedTrialId) {
    await supabase
      .from("trial_assessments")
      .delete()
      .eq("trial_id", trialId);
    await supabase
      .from("trial_medications_template")
      .delete()
      .eq("trial_id", trialId);
    await supabase
      .from("trial_optional_medications")
      .delete()
      .eq("trial_id", trialId);
  }

  // Save Assessments
  if (assessments.length > 0) {
    const payload = assessments.map((a) => ({
      trial_id: trialId,
      name: a.name,
      category: a.category,
      scheduled_days: (a.scheduledDays || []).map((d) =>
        typeof d === "string" ? parseInt(d.replace("d", ""), 10) : d
      ),
      applicable_cycles: a.applicableCycles || [],
      requirements: a.requirements || null,
      fasting_required:
        (a as any).fastingRequired ?? a.fasting_required ?? false,
    }));
    const { error } = await supabase.from("trial_assessments").insert(payload);
    if (error) throw error;
  }

  // Save Medications
  if (medications.length > 0) {
    const normalMeds = medications.filter((m) => !m.isOptional);
    const optionalMeds = medications.filter((m) => m.isOptional);

    if (normalMeds.length > 0) {
      const medPayload = normalMeds.map((m) => ({
        trial_id: trialId,
        drug_name: m.drug_name,
        frequency: m.frequency || null,
        scheduled_days: (m.scheduled_days || []).map((d) =>
          typeof d === "string" ? parseInt(d.replace("d", ""), 10) : d
        ),
        applicable_cycles: m.applicableCycles || [],
        special_conditions: m.specialConditions || null,
      }));
      const { error } = await supabase
        .from("trial_medications_template")
        .insert(medPayload);
      if (error) throw error;
    }

    if (optionalMeds.length > 0) {
      const optPayload = optionalMeds.map((m) => ({
        trial_id: trialId,
        drug_name: m.drug_name,
        frequency: m.frequency || null,
        scheduled_days: (m.scheduled_days || []).map((d) =>
          typeof d === "string" ? parseInt(d.replace("d", ""), 10) : d
        ),
        applicable_cycles: m.applicableCycles || [],
        special_conditions: m.specialConditions || null,
        category: m.optionalCategory,
      }));
      const { error } = await supabase
        .from("trial_optional_medications")
        .insert(optPayload);
      if (error) throw error;
    }
  }

  return trialId;
};
