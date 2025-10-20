import { formatISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../backend/supabaseClient";
import { Assessment, TrialMedication } from "../types/admin";

export const useTrialData = () => {
  // Basic trial info
  const [name, setName] = useState("");
  const [protocolVersion, setProtocolVersion] = useState("");
  const [trialPhase, setTrialPhase] = useState("");
  const [numberOfCycles, setNumberOfCycles] = useState<string>("");
  const [cycleDurationDays, setCycleDurationDays] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Assessments & Medications
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [medications, setMedications] = useState<TrialMedication[]>([]);

  // Drafts
  const [assessmentDraft, setAssessmentDraft] = useState<Partial<Assessment>>({});
  const [medDraft, setMedDraft] = useState<Partial<TrialMedication>>({});

  // Editing states
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);

  // Optional medication toggle + category
  const [isOptional, setIsOptional] = useState(false);
  const [optionalCategory, setOptionalCategory] = useState<string | null>(null);
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [openOptionalCategoryDropdown, setOpenOptionalCategoryDropdown] = useState(false);

  const [saving, setSaving] = useState(false);

  // Existing trials dropdown
  const [trials, setTrials] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [openTrialDropdown, setOpenTrialDropdown] = useState(false);

  useEffect(() => {
    const fetchTrials = async () => {
      const { data, error } = await supabase
        .from("trials")
        .select("id, name")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching trials:", error);
      } else {
        setTrials(data || []);
      }
    };
    fetchTrials();
  }, []);

  // Load selected trial data
  useEffect(() => {
    if (!selectedTrialId) return;

    const fetchTrialData = async () => {
      try {
        // Fetch trial metadata
        const { data: trialData, error: trialError } = await supabase
          .from("trials")
          .select("*")
          .eq("id", selectedTrialId)
          .single();

        if (trialError) throw trialError;
        if (trialData) {
          setName(trialData.name);
          setProtocolVersion(trialData.protocol_version);
          setTrialPhase(trialData.trial_phase);
          setNumberOfCycles(
            trialData.number_of_cycles !== null
              ? trialData.number_of_cycles.toString()
              : ""
          );
          setCycleDurationDays(
            trialData.cycle_duration_days !== null
              ? trialData.cycle_duration_days.toString()
              : ""
          );
          setNotes(trialData.notes || "");
        }

        // Fetch assessments
        const { data: assessmentsData, error: assessmentsError } =
          await supabase
            .from("trial_assessments")
            .select("*")
            .eq("trial_id", selectedTrialId);
        if (assessmentsError) throw assessmentsError;
        setAssessments(
          assessmentsData?.map((a) => ({
            ...a,
            scheduledDays: a.scheduled_days || [],
            applicableCycles: a.applicable_cycles || [],
            fasting_required: a.fasting_required || false,
          })) || []
        );

        // Fetch medications
        const { data: medicationsData, error: medicationsError } =
          await supabase
            .from("trial_medications_template")
            .select("*")
            .eq("trial_id", selectedTrialId);
        if (medicationsError) throw medicationsError;

        const { data: optionalMedsData, error: optionalMedsError } =
          await supabase
            .from("trial_optional_medications")
            .select("*")
            .eq("trial_id", selectedTrialId);
        if (optionalMedsError) throw optionalMedsError;

        setMedications([
          ...(medicationsData?.map((m) => ({
            ...m,
            scheduled_days: m.scheduled_days || [],
            applicableCycles: m.applicable_cycles || [],
            isOptional: false,
          })) || []),
          ...(optionalMedsData?.map((m) => ({
            ...m,
            isOptional: true,
            optionalCategory: m.category,
            scheduled_days: m.scheduled_days || [],
            applicableCycles: m.applicable_cycles || [],
          })) || []),
        ]);
      } catch (err: any) {
        console.error("Failed to load trial:", err);
        Alert.alert("Error", "Failed to load selected trial. See console.");
      }
    };

    fetchTrialData();
  }, [selectedTrialId]);

  // Day tokens for multi-select
  const dayTokens = useMemo(() => {
    const days = parseInt(cycleDurationDays, 10) || 0;
    return Array.from({ length: days }, (_, i) => `d${i + 1}`);
  }, [cycleDurationDays]);

  const cycleOptions = useMemo(() => {
    const n = parseInt(numberOfCycles, 10) || 0;
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [numberOfCycles]);

  // Multi-select dropdown state for days
  const [openDayDropdown, setOpenDayDropdown] = useState(false);
  const dayItems = useMemo(
    () =>
      dayTokens.map((d) => ({
        label: `Day ${d.replace("d", "")}`,
        value: d,
      })),
    [dayTokens]
  );

  // Assessment CRUD
  const startAddAssessment = () => {
    setEditingAssessmentId(null);
    setAssessmentDraft({
      id: `${Math.random().toString(36).substring(2, 9)}`, // keep behavior
      name: "",
      category: "Clinical Exam",
      scheduledDays: [],
      applicableCycles: [],
      requirements: "",
      fasting_required: false,
    });
  };

  const editAssessment = (assessment: Assessment) => {
    setEditingAssessmentId(assessment.id);
    setAssessmentDraft({ ...assessment });
  };

  const saveAssessmentDraft = () => {
    const draft = assessmentDraft as Assessment | undefined;
    if (!draft || !draft.name || !draft.category) {
      Alert.alert("Validation", "Assessment must have a name and category");
      return;
    }
    if (editingAssessmentId) {
      setAssessments((prev) =>
        prev.map((a) => (a.id === editingAssessmentId ? draft : a))
      );
    } else if (assessments.some((a) => a.id === draft.id)) {
      setAssessments((prev) =>
        prev.map((a) => (a.id === draft.id ? draft : a))
      );
    } else {
      setAssessments((prev) => [draft, ...prev]);
    }
    setAssessmentDraft({});
    setEditingAssessmentId(null);
  };

  const removeAssessment = (id: string) =>
    setAssessments((a) => a.filter((x) => x.id !== id));

  // Medication CRUD
  const startAddMedication = () => {
    setEditingMedicationId(null);
    setMedDraft({
      id: `${Math.random().toString(36).substring(2, 9)}`, // keep behavior
      drug_name: "",
      frequency: "",
      scheduled_days: [],
      applicableCycles: [],
      specialConditions: "",
    });
    setIsOptional(false);
    setOptionalCategory(null);
    setOtherCategoryText("");
  };

  const editMedication = (med: TrialMedication) => {
    setEditingMedicationId(med.id);
    setMedDraft({ ...med });
    setIsOptional(!!med.isOptional);
    setOptionalCategory(med.optionalCategory || null);
    setOtherCategoryText(
      med.optionalCategory === "other" ? med.optionalCategory || "" : ""
    );
  };

  const saveMedDraft = () => {
    const draft = medDraft as TrialMedication | undefined;
    if (!draft || !draft.drug_name) {
      Alert.alert("Validation", "Drug name required");
      return;
    }
    if (isOptional) {
      const categoryToSave =
        optionalCategory === "other"
          ? otherCategoryText.trim()
          : optionalCategory;
      if (!categoryToSave) {
        Alert.alert(
          "Validation",
          "Please select or specify a patient category for optional medication."
        );
        return;
      }
      draft.isOptional = true;
      draft.optionalCategory = categoryToSave;
    } else {
      draft.isOptional = false;
      draft.optionalCategory = null;
    }

    if (editingMedicationId) {
      setMedications((prev) =>
        prev.map((m) => (m.id === editingMedicationId ? draft : m))
      );
    } else if (medications.some((m) => m.id === draft.id)) {
      setMedications((prev) =>
        prev.map((m) => (m.id === draft.id ? draft : m))
      );
    } else {
      setMedications((prev) => [draft, ...prev]);
    }
    setMedDraft({});
    setEditingMedicationId(null);
    setIsOptional(false);
    setOptionalCategory(null);
    setOtherCategoryText("");
  };

  const removeMedication = (id: string) =>
    setMedications((m) => m.filter((x) => x.id !== id));

  // Reset form
  const resetForm = () => {
    setName("");
    setProtocolVersion("");
    setTrialPhase("");
    setNumberOfCycles("");
    setCycleDurationDays("");
    setNotes("");
    setAssessments([]);
    setMedications([]);
    setAssessmentDraft({});
    setMedDraft({});
    setIsOptional(false);
    setOptionalCategory(null);
    setOtherCategoryText("");
    setEditingAssessmentId(null);
    setEditingMedicationId(null);
    setSelectedTrialId(null);
  };

  // Save template to Supabase
  const saveTemplate = async () => {
    if (!name.trim() || !protocolVersion.trim()) {
      Alert.alert(
        "Validation",
        "Trial name and protocol version are required."
      );
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const createdBy = user?.id ?? null;

      const numCycles = parseInt(numberOfCycles, 10) || 0;
      const cycleDays = parseInt(cycleDurationDays, 10) || 0;

      let trialId = selectedTrialId;

      if (selectedTrialId) {
        const { error: updateError } = await supabase
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
        if (updateError) throw updateError;
      } else {
        const { data: trialData, error: trialError } = await supabase
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
        if (trialError) throw trialError;
        trialId = trialData.id;
      }

      if (selectedTrialId) {
        await supabase.from("trial_assessments").delete().eq("trial_id", trialId);
        await supabase.from("trial_medications_template").delete().eq("trial_id", trialId);
        await supabase.from("trial_optional_medications").delete().eq("trial_id", trialId);
      }

      if (assessments.length > 0) {
        const assPayload = assessments.map((a) => ({
          trial_id: trialId,
          name: a.name,
          category: a.category,
          scheduled_days: (a.scheduledDays || []).map((d) =>
            typeof d === "string" ? parseInt(d.replace("d", ""), 10) : d
          ),
          applicable_cycles: a.applicableCycles || [],
          requirements: a.requirements || null,
          fasting_required: (a as any).fastingRequired ?? a.fasting_required ?? false,
        }));
        const { error: assError } = await supabase
          .from("trial_assessments")
          .insert(assPayload);
        if (assError) throw assError;
      }

      if (medications.length > 0) {
        const normalMeds = medications.filter((m) => !m.isOptional);
        const optionalMeds = medications.filter((m) => m.isOptional);

        if (normalMeds.length > 0) {
          const medsPayload = normalMeds.map((m) => ({
            trial_id: trialId,
            drug_name: m.drug_name,
            frequency: m.frequency || null,
            scheduled_days: (m.scheduled_days || []).map((d) =>
              typeof d === "string" ? parseInt(d.replace("d", ""), 10) : d
            ),
            applicable_cycles: m.applicableCycles || [],
            special_conditions: m.specialConditions || null,
          }));
          const { error: medsError } = await supabase
            .from("trial_medications_template")
            .insert(medsPayload);
          if (medsError) throw medsError;
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
          const { error: optError } = await supabase
            .from("trial_optional_medications")
            .insert(optPayload);
          if (optError) throw optError;
        }
      }

      Alert.alert(
        "Success",
        selectedTrialId
          ? "Trial template updated successfully."
          : "Trial template created successfully."
      );
      resetForm();
    } catch (err: any) {
      console.error("Failed to save template", err);
      Alert.alert("Error", "Failed to save template. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return {
    // state
    name,
    protocolVersion,
    trialPhase,
    numberOfCycles,
    cycleDurationDays,
    notes,
    assessments,
    medications,
    assessmentDraft,
    medDraft,
    editingAssessmentId,
    editingMedicationId,
    isOptional,
    optionalCategory,
    otherCategoryText,
    openOptionalCategoryDropdown,
    saving,
    trials,
    selectedTrialId,
    openTrialDropdown,
    dayTokens,
    cycleOptions,
    openDayDropdown,
    dayItems,

    // setters
    setName,
    setProtocolVersion,
    setTrialPhase,
    setNumberOfCycles,
    setCycleDurationDays,
    setNotes,
    setAssessments,
    setMedications,
    setAssessmentDraft,
    setMedDraft,
    setEditingAssessmentId,
    setEditingMedicationId,
    setIsOptional,
    setOptionalCategory,
    setOtherCategoryText,
    setOpenOptionalCategoryDropdown,
    setSaving,
    setTrials,
    setSelectedTrialId,
    setOpenTrialDropdown,
    setOpenDayDropdown,

    // actions
    startAddAssessment,
    editAssessment,
    saveAssessmentDraft,
    removeAssessment,
    startAddMedication,
    editMedication,
    saveMedDraft,
    removeMedication,
    resetForm,
    saveTemplate,
  };
};
