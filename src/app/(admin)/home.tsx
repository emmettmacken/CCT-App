import { formatISO } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import {
  Button,
  Card,
  IconButton,
  RadioButton,
  Switch,
  TextInput,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/adminHome.styles";
import { Assessment, TrialMedication } from "../../types/admin";

const categoryOptions = [
  "Clinical Exam",
  "Lab Test",
  "Imaging",
  "Other",
];

const generateId = (prefix = "") =>
  `${prefix}${Math.random().toString(36).substring(2, 9)}`;

const AdminTrialTemplateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

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
  const [assessmentDraft, setAssessmentDraft] = useState<Partial<Assessment>>(
    {}
  );
  const [medDraft, setMedDraft] = useState<Partial<TrialMedication>>({});

  // Editing states
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(
    null
  );
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(
    null
  );

  // Optional medication toggle + category
  const [isOptional, setIsOptional] = useState(false);
  const [optionalCategory, setOptionalCategory] = useState<string | null>(null);
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [openOptionalCategoryDropdown, setOpenOptionalCategoryDropdown] =
    useState(false);

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
      id: generateId("ass-"),
      name: "",
      category: categoryOptions[0],
      scheduledDays: [],
      applicableCycles: [],
      requirements: "",
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
      id: generateId("med-"),
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
        // Update existing trial
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
        // Insert new trial
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

      // Clear existing assessments & medications if editing
      if (selectedTrialId) {
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

      // Insert assessments
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
        }));
        const { error: assError } = await supabase
          .from("trial_assessments")
          .insert(assPayload);
        if (assError) throw assError;
      }

      // Insert medications
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

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create / Edit Trial Template</Text>

        {/* Select Existing Trial */}
        <Text style={{ marginBottom: 8 }}>Edit an existing trial:</Text>
        <DropDownPicker
          open={openTrialDropdown}
          value={selectedTrialId}
          items={trials.map((t) => ({ label: t.name, value: t.id }))}
          setOpen={setOpenTrialDropdown}
          setValue={setSelectedTrialId}
          placeholder="Select a trial to edit"
          style={{ marginBottom: 16 }}
          listMode="MODAL"
          modalProps={{ animationType: "slide" }}
        />

        {/* Basic Trial Info */}
        <Card style={styles.card}>
          <Card.Title title="Basic Trial Information" />
          <Card.Content>
            <TextInput
              label="Trial Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Protocol Version"
              value={protocolVersion}
              onChangeText={setProtocolVersion}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Phase (eg. Induction, Maintenance, etc.)"
              value={trialPhase}
              onChangeText={setTrialPhase}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Number of Cycles"
              value={numberOfCycles}
              keyboardType="number-pad"
              onChangeText={setNumberOfCycles}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Cycle Duration (days)"
              value={cycleDurationDays}
              keyboardType="number-pad"
              onChangeText={setCycleDurationDays}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              style={[styles.input, { minHeight: 80 }]}
            />
          </Card.Content>
        </Card>

        {/* Assessments */}
        <Card style={styles.card}>
          <Card.Title title="Assessments / Evaluations" />
          <Card.Content>
            <Button
              mode="outlined"
              onPress={startAddAssessment}
              style={{ marginBottom: 12 }}
            >
              New Assessment
            </Button>
            {assessmentDraft && Object.keys(assessmentDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput
                  label="Assessment Name"
                  value={assessmentDraft.name || ""}
                  onChangeText={(t) =>
                    setAssessmentDraft((d) => ({
                      ...(d as Assessment),
                      name: t,
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                />
                <Text style={styles.label}>Category</Text>
                <RadioButton.Group
                  onValueChange={(v) =>
                    setAssessmentDraft((d) => ({
                      ...(d as Assessment),
                      category: v,
                    }))
                  }
                  value={assessmentDraft.category || categoryOptions[0]}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {categoryOptions.map((c) => (
                      <View
                        key={c}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: 12,
                        }}
                      >
                        <RadioButton value={c} />
                        <Text>{c}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>

                <Text style={styles.label}>Scheduled Days</Text>
                <DropDownPicker
                  multiple={true}
                  open={openDayDropdown}
                  value={assessmentDraft.scheduledDays}
                  items={dayItems}
                  setOpen={setOpenDayDropdown}
                  setValue={(callback) =>
                    setAssessmentDraft((d) => ({
                      ...(d as Assessment),
                      scheduledDays: callback(d?.scheduledDays || []),
                    }))
                  }
                  placeholder="Select Scheduled Days"
                  mode="BADGE"
                  style={{ marginBottom: 8 }}
                />

                <Text style={styles.label}>Applicable Cycles</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {cycleOptions.map((c) => {
                    const selected = (
                      assessmentDraft.applicableCycles || []
                    ).includes(c);
                    return (
                      <Button
                        key={c}
                        mode={selected ? "contained" : "outlined"}
                        onPress={() => {
                          const aps = new Set(
                            assessmentDraft.applicableCycles || []
                          );
                          if (aps.has(c)) aps.delete(c);
                          else aps.add(c);
                          setAssessmentDraft((d) => ({
                            ...(d as Assessment),
                            applicableCycles: Array.from(aps),
                          }));
                        }}
                        style={{ marginRight: 4, marginBottom: 4 }}
                      >
                        {c}
                      </Button>
                    );
                  })}
                </View>

                <TextInput
                  label="Requirements?"
                  value={assessmentDraft.requirements || ""}
                  onChangeText={(t) =>
                    setAssessmentDraft((d) => ({
                      ...(d as Assessment),
                      requirements: t,
                    }))
                  }
                  mode="outlined"
                  multiline
                  style={[styles.input, { minHeight: 80 }]}
                />

                <View style={{ flexDirection: "row", marginTop: 8 }}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setAssessmentDraft({});
                      setEditingAssessmentId(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={saveAssessmentDraft}
                    style={{ flex: 1, marginLeft: 8 }}
                  >
                    {editingAssessmentId
                      ? "Update Assessment"
                      : "Save Assessment"}
                  </Button>
                </View>
              </View>
            )}
            {assessments.length > 0 ? (
              assessments.map((a) => (
                <Card key={a.id} style={styles.itemCard}>
                  <Card.Content>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text>
                        {a.name} ({a.category})
                      </Text>
                      <View style={{ flexDirection: "row" }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => editAssessment(a)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeAssessment(a.id)}
                        />
                      </View>
                    </View>
                    <Text>
                      Scheduled Days: {(a.scheduledDays || []).join(", ")}
                    </Text>
                    {(a.applicableCycles || []).length > 0 && (
                      <Text>
                        Cycles: {(a.applicableCycles || []).join(", ")}
                      </Text>
                    )}
                    {a.requirements && (
                      <Text>Requirements: {a.requirements}</Text>
                    )}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text>No assessments added</Text>
            )}
          </Card.Content>
        </Card>

        {/* Medications */}
        <Card style={styles.card}>
          <Card.Title title="Medication Administration" />
          <Card.Content>
            <Button
              mode="outlined"
              onPress={startAddMedication}
              style={{ marginBottom: 12 }}
            >
              New Drug Regimen
            </Button>
            {medDraft && Object.keys(medDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput
                  label="Drug Name"
                  value={medDraft.drug_name || ""}
                  onChangeText={(t) =>
                    setMedDraft((d) => ({
                      ...(d as TrialMedication),
                      drug_name: t,
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Frequency"
                  value={medDraft.frequency || ""}
                  onChangeText={(t) =>
                    setMedDraft((d) => ({
                      ...(d as TrialMedication),
                      frequency: t,
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                />

                <Text style={styles.label}>Administration Pattern</Text>
                <DropDownPicker
                  multiple={true}
                  open={openDayDropdown}
                  value={medDraft.scheduled_days || []}
                  items={dayItems}
                  setOpen={setOpenDayDropdown}
                  setValue={(callback) =>
                    setMedDraft((d) => ({
                      ...(d as TrialMedication),
                      scheduled_days: callback(d?.scheduled_days || []),
                    }))
                  }
                  placeholder="Select Administration Days"
                  mode="BADGE"
                  style={{ marginBottom: 8 }}
                />

                <Text style={styles.label}>Applicable Cycles</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {cycleOptions.map((c) => {
                    const selected = (medDraft.applicableCycles || []).includes(
                      c
                    );
                    return (
                      <Button
                        key={c}
                        mode={selected ? "contained" : "outlined"}
                        onPress={() => {
                          const aps = new Set(medDraft.applicableCycles || []);
                          if (aps.has(c)) aps.delete(c);
                          else aps.add(c);
                          setMedDraft((d) => ({
                            ...(d as TrialMedication),
                            applicableCycles: Array.from(aps),
                          }));
                        }}
                        style={{ marginRight: 4, marginBottom: 4 }}
                      >
                        {c}
                      </Button>
                    );
                  })}
                </View>

                <TextInput
                  label="Special Conditions"
                  value={medDraft.specialConditions || ""}
                  onChangeText={(t) =>
                    setMedDraft((d) => ({
                      ...(d as TrialMedication),
                      specialConditions: t || null,
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                />

                {/* Optional Medication Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text>Optional Medication for specific patients</Text>
                  <Switch
                    value={isOptional}
                    onValueChange={setIsOptional}
                    style={{ marginLeft: 12 }}
                  />
                </View>
                {isOptional && (
                  <>
                    <DropDownPicker
                      open={openOptionalCategoryDropdown}
                      value={optionalCategory}
                      items={[
                        { label: "70+ only", value: "70+" },
                        { label: "High-risk", value: "high-risk" },
                        {
                          label: "Both 70+ and High-risk only",
                          value: "both 70+ and high-risk",
                        },
                        { label: "Other", value: "other" },
                      ]}
                      setOpen={setOpenOptionalCategoryDropdown}
                      setValue={setOptionalCategory}
                      placeholder="Select Category"
                      style={{ marginBottom: 8 }}
                      listMode="MODAL"
                      modalProps={{
                        animationType: "slide",
                      }}
                    />
                    {optionalCategory === "other" && (
                      <TextInput
                        label="Specify Category"
                        value={otherCategoryText}
                        onChangeText={setOtherCategoryText}
                        mode="outlined"
                        style={{ marginBottom: 8 }}
                      />
                    )}
                  </>
                )}

                <View style={{ flexDirection: "row", marginTop: 8 }}>
                  <Button
                    mode="outlined"
                    onPress={() => setMedDraft({})}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={saveMedDraft}
                    style={{ flex: 1, marginLeft: 8 }}
                  >
                    Save Drug
                  </Button>
                </View>
              </View>
            )}
            {medications.length > 0 ? (
              medications.map((m) => (
                <Card key={m.id} style={styles.itemCard}>
                  <Card.Content>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text>{m.drug_name}</Text>
                      <View style={{ flexDirection: "row" }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => editMedication(m)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeMedication(m.id)}
                        />
                      </View>
                    </View>
                    <Text>Frequency: {m.frequency}</Text>
                    <Text>Days: {(m.scheduled_days || []).join(", ")}</Text>
                    {(m.applicableCycles || []).length > 0 && (
                      <Text>
                        Cycles: {(m.applicableCycles || []).join(", ")}
                      </Text>
                    )}
                    {m.specialConditions && (
                      <Text>Conditions: {m.specialConditions}</Text>
                    )}
                    {m.isOptional && (
                      <Text>Optional: {m.optionalCategory}</Text>
                    )}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text>No medications added</Text>
            )}
          </Card.Content>
        </Card>

        {/* Save Template */}
        <Button
          mode="contained"
          onPress={saveTemplate}
          disabled={saving}
          style={{ marginVertical: 16 }}
        >
          {saving ? "Saving..." : "Save Trial Template"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTrialTemplateScreen;
