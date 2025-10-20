import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { Assessment, TrialMedication } from "../types/admin";
import {
  fetchAssessments,
  fetchMedications,
  fetchTrialDetails,
  fetchTrials,
  saveTrialToDB,
} from "../utils/supabaseOps";
import {
  confirmRequired,
  createNewAssessment,
  createNewMedication,
  normalizeCycles,
  normalizeDayTokens,
  validateAssessment,
  validateMedication,
} from "../utils/trialHelpers";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export const useTrialData = () => {
  
  const [name, setName] = useState("");
  const [protocolVersion, setProtocolVersion] = useState("");
  const [trialPhase, setTrialPhase] = useState("");
  const [numberOfCycles, setNumberOfCycles] = useState("");
  const [cycleDurationDays, setCycleDurationDays] = useState("");
  const [notes, setNotes] = useState("");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentDraft, setAssessmentDraft] =
    useState<Partial<Assessment>>({});
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(
    null
  );

  const [medications, setMedications] = useState<TrialMedication[]>([]);
  const [medDraft, setMedDraft] = useState<Partial<TrialMedication>>({});
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(
    null
  );

  const [isOptional, setIsOptional] = useState(false);
  const [optionalCategory, setOptionalCategory] = useState<string | null>(null);
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [openOptionalCategoryDropdown, setOpenOptionalCategoryDropdown] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [trials, setTrials] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [openTrialDropdown, setOpenTrialDropdown] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);

  const dayTokens = useMemo(
    () => normalizeDayTokens(cycleDurationDays),
    [cycleDurationDays]
  );
  const cycleOptions = useMemo(
    () => normalizeCycles(numberOfCycles),
    [numberOfCycles]
  );
  const dayItems = useMemo(
    () =>
      dayTokens.map((d) => ({
        label: `Day ${d.replace("d", "")}`,
        value: d,
      })),
    [dayTokens]
  );

  useEffect(() => {
    fetchTrials().then(setTrials);
  }, []);

  useEffect(() => {
    if (!selectedTrialId) return;
    (async () => {
      try {
        const trial = await fetchTrialDetails(selectedTrialId);
        setName(trial.name);
        setProtocolVersion(trial.protocol_version);
        setTrialPhase(trial.trial_phase);
        setNumberOfCycles(trial.number_of_cycles?.toString() || "");
        setCycleDurationDays(trial.cycle_duration_days?.toString() || "");
        setNotes(trial.notes || "");

        const a = await fetchAssessments(selectedTrialId);
        const m = await fetchMedications(selectedTrialId);
        setAssessments(a);
        setMedications(m);
      } catch (err: any) {
        console.error(err);
        Alert.alert("Error", "Failed to load selected trial data.");
      }
    })();
  }, [selectedTrialId]);


  const startAddAssessment = () => {
    setEditingAssessmentId(null);
    setAssessmentDraft(createNewAssessment());
  };

  const editAssessment = (a: Assessment) => {
    setEditingAssessmentId(a.id);
    setAssessmentDraft({ ...a });
  };

  const saveAssessmentDraft = () => {
    if (!validateAssessment(assessmentDraft)) {
      Alert.alert("Validation", "Assessment must have a name and category");
      return;
    }
    const draft = assessmentDraft as Assessment;
    setAssessments((prev) =>
      editingAssessmentId
        ? prev.map((x) => (x.id === editingAssessmentId ? draft : x))
        : prev.some((x) => x.id === draft.id)
        ? prev.map((x) => (x.id === draft.id ? draft : x))
        : [draft, ...prev]
    );
    setAssessmentDraft({});
    setEditingAssessmentId(null);
  };

  const removeAssessment = (id: string) =>
    setAssessments((a) => a.filter((x) => x.id !== id));

  const startAddMedication = () => {
    setEditingMedicationId(null);
    setMedDraft(createNewMedication());
    setIsOptional(false);
    setOptionalCategory(null);
    setOtherCategoryText("");
  };

  const editMedication = (m: TrialMedication) => {
    setEditingMedicationId(m.id);
    setMedDraft({ ...m });
    setIsOptional(!!m.isOptional);
    setOptionalCategory(m.optionalCategory || null);
    setOtherCategoryText(
      m.optionalCategory === "other" ? m.optionalCategory || "" : ""
    );
  };

  const saveMedDraft = () => {
    if (!validateMedication(medDraft)) {
      Alert.alert("Validation", "Drug name required");
      return;
    }
    const draft = medDraft as TrialMedication;
    if (isOptional) {
      const categoryToSave =
        optionalCategory === "other"
          ? otherCategoryText.trim()
          : optionalCategory;
      if (!categoryToSave) {
        Alert.alert("Validation", "Select or specify optional medication group");
        return;
      }
      draft.isOptional = true;
      draft.optionalCategory = categoryToSave;
    } else {
      draft.isOptional = false;
      draft.optionalCategory = null;
    }

    setMedications((prev) =>
      editingMedicationId
        ? prev.map((x) => (x.id === editingMedicationId ? draft : x))
        : prev.some((x) => x.id === draft.id)
        ? prev.map((x) => (x.id === draft.id ? draft : x))
        : [draft, ...prev]
    );
    setMedDraft({});
    setEditingMedicationId(null);
    setIsOptional(false);
    setOptionalCategory(null);
    setOtherCategoryText("");
  };

  const removeMedication = (id: string) =>
    setMedications((m) => m.filter((x) => x.id !== id));


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

  const saveTemplate = async () => {
    if (!confirmRequired(name, protocolVersion)) {
      Alert.alert(
        "Validation",
        "Trial name and protocol version are required."
      );
      return;
    }
    setIsSaving(true);
    try {
      const trialData = {
        name,
        protocolVersion,
        trialPhase,
        numberOfCycles,
        cycleDurationDays,
        notes,
      };

      const isUpdate = !!selectedTrialId;
      await saveTrialToDB(
        trialData,
        assessments,
        medications,
        isUpdate,
        selectedTrialId
      );

      Alert.alert(
        "Success",
        isUpdate
          ? "Trial template updated successfully."
          : "Trial template created successfully."
      );
      resetForm();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // Basic
    name,
    protocolVersion,
    trialPhase,
    numberOfCycles,
    cycleDurationDays,
    notes,
    setName,
    setProtocolVersion,
    setTrialPhase,
    setNumberOfCycles,
    setCycleDurationDays,
    setNotes,

    // Assessments
    assessments,
    assessmentDraft,
    setAssessmentDraft,
    editingAssessmentId,
    startAddAssessment,
    editAssessment,
    saveAssessmentDraft,
    removeAssessment,

    // Medications
    medications,
    medDraft,
    setMedDraft,
    editingMedicationId,
    startAddMedication,
    editMedication,
    saveMedDraft,
    removeMedication,
    isOptional,
    setIsOptional,
    optionalCategory,
    setOptionalCategory,
    otherCategoryText,
    setOtherCategoryText,
    openOptionalCategoryDropdown,
    setOpenOptionalCategoryDropdown,

    // Dropdowns & meta
    trials,
    selectedTrialId,
    setSelectedTrialId,
    openTrialDropdown,
    setOpenTrialDropdown,
    isDayDropdownOpen,
    setIsDayDropdownOpen,
    dayItems,
    cycleOptions,

    // Actions
    isSaving,
    saveTemplate,
    resetForm,
  };
};
