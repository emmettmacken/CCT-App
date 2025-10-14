import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/edit.styles";
import { useTabRefresh } from "../../hooks/useTabRefresh";

export default function MassEditsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [uniqueAppointments, setUniqueAppointments] = useState<any[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [selectedField, setSelectedField] = useState<
    "title" | "location" | "category" | "requirements" | ""
  >("");
  const [currentFieldValue, setCurrentFieldValue] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Fetch all trials
  const fetchTrials = async () => {
    const { data, error } = await supabase
      .from("trials")
      .select("id, name, trial_phase");
    if (error) Alert.alert("Error fetching trials", error.message);
    else setTrials(data || []);
  };

  // Medications
  const [uniqueTrialMeds, setUniqueTrialMeds] = useState<any[]>([]);
  const [selectedMassTrialMedId, setSelectedMassTrialMedId] = useState<
    string | null
  >(null);
  const [selectedMedField, setSelectedMedField] = useState<
    "name" | "frequency" | "notes" | ""
  >("");
  const [currentMedFieldValue, setCurrentMedFieldValue] = useState("");
  const [newMedFieldValue, setNewMedFieldValue] = useState("");
  const [showMassEditMedModal, setShowMassEditMedModal] = useState(false);

  // Fetch unique appointment titles for a selected trial
  const fetchAppointmentsByTrial = async (trialId: string) => {
    try {
      const { data: patientTrials, error: ptError } = await supabase
        .from("patient_trials")
        .select("id")
        .eq("trial_id", trialId);

      if (ptError) throw ptError;
      if (!patientTrials?.length) {
        setUniqueAppointments([]);
        return;
      }

      const patientTrialIds = patientTrials.map((pt) => pt.id);

      // Fetch all appointments linked to those patient_trial_ids
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, title, category, location, requirements, patient_trial_id")
        .in("patient_trial_id", patientTrialIds);

      if (apptError) throw apptError;

      if (!appointments?.length) {
        setUniqueAppointments([]);
        return;
      }

      // Create unique list by title
      const unique = Object.values(
        appointments.reduce((acc, appt) => {
          if (!acc[appt.title]) acc[appt.title] = appt;
          return acc;
        }, {} as Record<string, any>)
      );

      setUniqueAppointments(unique);
    } catch (err: any) {
      Alert.alert("Error fetching appointments", err.message);
    }
  };

  // Fetch unique trial medications
  const fetchTrialMedications = async (trialId: string) => {
    try {
      const { data: patientTrials, error: ptError } = await supabase
        .from("patient_trials")
        .select("id")
        .eq("trial_id", trialId);
      if (ptError) throw ptError;

      if (!patientTrials || patientTrials.length === 0) {
        setUniqueTrialMeds([]);
        return;
      }

      const patientTrialIds = patientTrials.map((pt) => pt.id);

      const { data: meds, error: medError } = await supabase
        .from("trial_medications")
        .select("id, name, frequency, notes, patient_trial_id")
        .in("patient_trial_id", patientTrialIds);

      if (medError) throw medError;

      const unique = Object.values(
        meds.reduce((acc, med) => {
          if (!acc[med.name]) acc[med.name] = med;
          return acc;
        }, {} as Record<string, any>)
      );

      setUniqueTrialMeds(unique);
    } catch (err: any) {
      Alert.alert("Error fetching medications", err.message);
    }
  };

  // Save changes to all appointments matching title & trial
  const handleSave = async () => {
    if (!selectedAppt || !selectedField || !newFieldValue.trim()) {
      Alert.alert(
        "Missing input",
        "Please select all fields and enter a value."
      );
      return;
    }

    try {
      const { data: patientTrials, error: ptError } = await supabase
        .from("patient_trials")
        .select("id")
        .eq("trial_id", selectedTrialId);

      if (ptError) throw ptError;
      if (!patientTrials?.length) {
        Alert.alert("No patients found for this trial.");
        return;
      }

      const patientTrialIds = patientTrials.map((pt) => pt.id);

      let valueToUpdate: any = newFieldValue;
      if (selectedField === "requirements") {
        valueToUpdate = newFieldValue
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ [selectedField]: valueToUpdate })
        .in("patient_trial_id", patientTrialIds)
        .eq("title", selectedAppt.title);

      if (updateError) throw updateError;

      Alert.alert(
        "Success",
        `Updated all "${selectedAppt.title}" appointments for this trial.`
      );
      setShowModal(false);
      resetState();
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.error("Mass update failed:", err);
    }
  };

  // Save medications
  const handleSaveMedications = async () => {
    if (
      !selectedMassTrialMedId ||
      !selectedMedField ||
      !newMedFieldValue.trim()
    )
      return;

    const med = uniqueTrialMeds.find((m) => m.id === selectedMassTrialMedId);
    if (!med || !selectedTrialId) return;

    try {
      const { data: patientTrials, error: ptError } = await supabase
        .from("patient_trials")
        .select("id")
        .eq("trial_id", selectedTrialId);
      if (ptError) throw ptError;

      const patientTrialIds = patientTrials.map((pt) => pt.id);

      const { error } = await supabase
        .from("trial_medications")
        .update({ [selectedMedField]: newMedFieldValue })
        .in("patient_trial_id", patientTrialIds)
        .eq("name", med.name);

      if (error) throw error;

      Alert.alert(
        "Success",
        `Updated all "${med.name}" medications in this trial.`
      );
      setShowMassEditMedModal(false);
      await fetchTrialMedications(selectedTrialId);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Delete all appointments for that trial with this title
  const handleDelete = async () => {
    if (!selectedTrialId || !selectedAppt) return;

    Alert.alert(
      "Confirm Delete",
      `Delete all "${selectedAppt.title}" appointments for this trial?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: patientTrials, error: ptError } = await supabase
                .from("patient_trials")
                .select("id")
                .eq("trial_id", selectedTrialId);

              if (ptError) throw ptError;
              if (!patientTrials?.length) {
                Alert.alert("No patients found for this trial.");
                return;
              }

              const patientTrialIds = patientTrials.map((pt) => pt.id);

              const { error: delError } = await supabase
                .from("appointments")
                .delete()
                .in("patient_trial_id", patientTrialIds)
                .eq("title", selectedAppt.title);

              if (delError) throw delError;

              Alert.alert("Deleted", "All matching appointments removed.");
              setShowModal(false);
              resetState();
            } catch (err: any) {
              Alert.alert("Error", err.message);
              console.error("Delete failed:", err);
            }
          },
        },
      ]
    );
  };

  // Delete medications
  const handleDeleteMedications = async () => {
    const med = uniqueTrialMeds.find((m) => m.id === selectedMassTrialMedId);
    if (!med || !selectedTrialId) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete all "${med.name}" medications in this trial?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: patientTrials, error: ptError } = await supabase
                .from("patient_trials")
                .select("id")
                .eq("trial_id", selectedTrialId);
              if (ptError) throw ptError;

              const patientTrialIds = patientTrials.map((pt) => pt.id);

              const { error } = await supabase
                .from("trial_medications")
                .delete()
                .in("patient_trial_id", patientTrialIds)
                .eq("name", med.name);

              if (error) throw error;

              Alert.alert("Success", `Deleted all "${med.name}" medications.`);
              setShowMassEditMedModal(false);
              await fetchTrialMedications(selectedTrialId);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const resetState = () => {
    setSelectedTrialId(null);
    setUniqueAppointments([]);
    setSelectedAppt(null);
    setSelectedField("");
    setCurrentFieldValue("");
    setNewFieldValue("");
  };

  useTabRefresh(() => {
    resetState();
    fetchTrials();
    if (selectedTrialId) {
      fetchAppointmentsByTrial(selectedTrialId);
      fetchTrialMedications(selectedTrialId);
    }
  });

  useEffect(() => {
    fetchTrials();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Button
        mode="contained"
        onPress={() => setShowModal(true)}
        style={styles.mainButton}
      >
        Mass edit all patient appointments
      </Button>

      <Button
        mode="contained"
        onPress={() => setShowMassEditMedModal(true)}
        style={[styles.mainButton, { backgroundColor: "#4a90e2" }]}
      >
        Mass edit all patient trial medications
      </Button>

      {/* Mass Edit Appointments Modal */}
      <Modal
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <View style={styles.header}>
                  <Text style={styles.modalTitle}>Mass Edit Appointments</Text>
                </View>

                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Step 1: Choose Trial */}
                  <Text style={styles.label}>Select a Trial:</Text>
                  {trials.length === 0 ? (
                    <Text>No trials found.</Text>
                  ) : (
                    trials.map((trial) => (
                      <TouchableOpacity
                        key={trial.id}
                        style={[
                          styles.option,
                          selectedTrialId === trial.id && styles.optionSelected,
                        ]}
                        onPress={() => {
                          setSelectedTrialId(trial.id);
                          setSelectedAppt(null);
                          setSelectedField("");
                          setCurrentFieldValue("");
                          setNewFieldValue("");
                          fetchAppointmentsByTrial(trial.id);
                        }}
                      >
                        <Text
                          style={{
                            color:
                              selectedTrialId === trial.id ? "#fff" : "#000",
                          }}
                        >
                          {trial.name} ({trial.trial_phase})
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}

                  {/* Step 2: Choose Appointment */}
                  {selectedTrialId && (
                    <>
                      <Text style={styles.label}>
                        Select Appointment Title:
                      </Text>
                      {uniqueAppointments.length === 0 ? (
                        <Text>No appointments found for this trial.</Text>
                      ) : (
                        uniqueAppointments.map((appt) => (
                          <TouchableOpacity
                            key={appt.id}
                            style={[
                              styles.option,
                              selectedAppt?.id === appt.id &&
                                styles.optionSelected,
                            ]}
                            onPress={() => {
                              setSelectedAppt(appt);
                              setSelectedField("");
                              setNewFieldValue("");
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  selectedAppt?.id === appt.id
                                    ? "#fff"
                                    : "#000",
                              }}
                            >
                              {appt.title} | {appt.category ?? ""} |{" "}
                              {appt.location ?? ""}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </>
                  )}

                  {/* Step 3: Choose Field */}
                  {selectedAppt && (
                    <>
                      <Text style={styles.label}>Select Field to Edit:</Text>
                      {["title", "category", "location", "requirements"].map(
                        (field) => (
                          <TouchableOpacity
                            key={field}
                            style={[
                              styles.option,
                              selectedField === field && styles.optionSelected,
                            ]}
                            onPress={() => {
                              setSelectedField(
                                field as
                                  | "title"
                                  | "category"
                                  | "location"
                                  | "requirements"
                              );
                              const appt = uniqueAppointments.find(
                                (a) => a.id === selectedAppt.id
                              );
                              let currentValue = "";
                              if (field === "title")
                                currentValue = appt?.title ?? "";
                              else if (field === "category")
                                currentValue = appt?.category ?? "";
                              else if (field === "location")
                                currentValue = appt?.location ?? "";
                              else if (field === "requirements") {
                                if (
                                  Array.isArray(appt?.requirements) &&
                                  appt.requirements.length > 0
                                )
                                  currentValue = appt.requirements.join(", ");
                                else currentValue = "None";
                              }
                              setCurrentFieldValue(currentValue);
                              setNewFieldValue("");
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  selectedField === field ? "#fff" : "#000",
                              }}
                            >
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                      {/* Step 4: Edit */}
                      {selectedField !== "" && (
                        <>
                          <Text style={styles.label}>Current Value:</Text>
                          <Text style={styles.currentValue}>
                            {currentFieldValue && currentFieldValue !== "None"
                              ? currentFieldValue
                              : "None"}
                          </Text>

                          <TextInput
                            style={styles.textInput}
                            placeholder={
                              selectedField === "requirements"
                                ? "Separate multiple values with commas"
                                : "Enter new value"
                            }
                            value={newFieldValue}
                            onChangeText={setNewFieldValue}
                          />
                        </>
                      )}
                    </>
                  )}
                </ScrollView>

                {/* Persistent Buttons */}
                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={() => setShowModal(false)}>
                    Close
                  </Button>
                  <Button
                    buttonColor="#47b53fff"
                    mode="contained"
                    onPress={handleSave}
                    disabled={
                      !selectedTrialId ||
                      !selectedAppt ||
                      !selectedField ||
                      !newFieldValue.trim()
                    }
                  >
                    Save
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor="#d11a2a"
                    onPress={handleDelete}
                    disabled={!selectedAppt}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Mass Edit Medications Modal */}
      <Modal
        visible={showMassEditMedModal}
        onRequestClose={() => setShowMassEditMedModal(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Mass Edit Trial Medications</Text>

            {/* Step 1: Choose Trial */}
            <Text style={styles.label}>Select a Trial:</Text>
            {trials.length === 0 ? (
              <Text>No trials found.</Text>
            ) : (
              trials.map((trial) => (
                <TouchableOpacity
                  key={trial.id}
                  style={[
                    styles.option,
                    selectedTrialId === trial.id && styles.optionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTrialId(trial.id);
                    setSelectedMassTrialMedId(null);
                    setSelectedMedField("");
                    setCurrentMedFieldValue("");
                    setNewMedFieldValue("");
                    fetchTrialMedications(trial.id);
                  }}
                >
                  <Text
                    style={{
                      color: selectedTrialId === trial.id ? "#fff" : "#000",
                    }}
                  >
                    {trial.name} ({trial.trial_phase})
                  </Text>
                </TouchableOpacity>
              ))
            )}

            {/* Step 2: Choose Medication */}
            {selectedTrialId && (
              <>
                <Text style={styles.label}>Select Medication:</Text>
                {uniqueTrialMeds.length === 0 ? (
                  <Text>No medications found for this trial.</Text>
                ) : (
                  uniqueTrialMeds.map((med) => (
                    <TouchableOpacity
                      key={med.id}
                      style={[
                        styles.option,
                        selectedMassTrialMedId === med.id &&
                          styles.optionSelected,
                      ]}
                      onPress={() => {
                        setSelectedMassTrialMedId(med.id);
                        setSelectedMedField("");
                        setNewMedFieldValue("");
                      }}
                    >
                      <Text
                        style={{
                          color:
                            selectedMassTrialMedId === med.id ? "#fff" : "#000",
                        }}
                      >
                        {med.name} | {med.frequency ?? ""} | {med.notes ?? ""}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {/* Step 3: Choose Field */}
            {selectedMassTrialMedId && (
              <>
                <Text style={styles.label}>Select Field to Edit:</Text>
                {["name", "frequency", "notes"].map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={[
                      styles.option,
                      selectedMedField === field && styles.optionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMedField(
                        field as "name" | "frequency" | "notes"
                      );
                      const med = uniqueTrialMeds.find(
                        (m) => m.id === selectedMassTrialMedId
                      );
                      let currentValue = "";
                      if (field === "name") currentValue = med?.name ?? "";
                      else if (field === "frequency")
                        currentValue = med?.frequency ?? "";
                      else currentValue = med?.notes ?? "";
                      setCurrentMedFieldValue(currentValue);
                      setNewMedFieldValue("");
                    }}
                  >
                    <Text
                      style={{
                        color: selectedMedField === field ? "#fff" : "#000",
                      }}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Step 4: Edit */}
                {selectedMedField !== "" && (
                  <>
                    <Text style={styles.label}>Current Value:</Text>
                    <Text style={styles.currentValue}>
                      {currentMedFieldValue || "None"}
                    </Text>

                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new value"
                      value={newMedFieldValue}
                      onChangeText={setNewMedFieldValue}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Buttons pinned at bottom */}
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => setShowMassEditMedModal(false)}
            >
              Close
            </Button>
            <Button
              buttonColor="#47b53fff"
              mode="contained"
              onPress={handleSaveMedications}
              disabled={!selectedMedField || !newMedFieldValue.trim()}
            >
              Save
            </Button>
            <Button
              mode="contained"
              buttonColor="#d11a2a"
              onPress={handleDeleteMedications}
              disabled={!selectedMassTrialMedId}
            >
              Delete
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}