import React, { useState } from "react";
import {
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
import { styles } from "../../styles/edit.styles";
import { useMassEdits } from "../../hooks/useMassEdits";

export default function MassEditsScreen() {
  const {
    trials,
    uniqueAppointments,
    uniqueTrialMeds,
    selectedTrialId,
    setSelectedTrialId,
    selectedAppt,
    setSelectedAppt,
    selectedField,
    setSelectedField,
    currentFieldValue,
    setCurrentFieldValue,
    newFieldValue,
    setNewFieldValue,
    selectedMassTrialMedId,
    setSelectedMassTrialMedId,
    selectedMedField,
    setSelectedMedField,
    currentMedFieldValue,
    setCurrentMedFieldValue,
    newMedFieldValue,
    setNewMedFieldValue,
    handleSaveAppointments,
    handleSaveMedications,
    handleDeleteAppointments,
    handleDeleteMedications,
    // use the state-setting wrappers:
    loadAppointmentsByTrial,
    loadTrialMedications,
  } = useMassEdits();

  const [showModal, setShowModal] = useState(false);
  const [showMassEditMedModal, setShowMassEditMedModal] = useState(false);

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
                          loadAppointmentsByTrial(trial.id);
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
                      <Text style={styles.label}>Select Appointment Title:</Text>
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
                              setSelectedField(field);
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
                    onPress={handleSaveAppointments}
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
                    onPress={handleDeleteAppointments}
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
                    loadTrialMedications(trial.id);
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
                      setSelectedMedField(field);
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
