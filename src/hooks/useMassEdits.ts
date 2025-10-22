import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTabRefresh } from "./useTabRefresh";
import {
  fetchTrials,
  fetchAppointmentsByTrial,
  fetchTrialMedications,
  updateAllAppointments,
  updateAllMedications,
  deleteAllAppointments,
  deleteAllMedications,
} from "../utils/massEditHelpers";

export const useMassEdits = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [uniqueAppointments, setUniqueAppointments] = useState<any[]>([]);
  const [uniqueTrialMeds, setUniqueTrialMeds] = useState<any[]>([]);

  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [selectedField, setSelectedField] = useState("");
  const [currentFieldValue, setCurrentFieldValue] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const [selectedMassTrialMedId, setSelectedMassTrialMedId] = useState<string | null>(null);
  const [selectedMedField, setSelectedMedField] = useState("");
  const [currentMedFieldValue, setCurrentMedFieldValue] = useState("");
  const [newMedFieldValue, setNewMedFieldValue] = useState("");

  useEffect(() => {
    fetchTrials().then(setTrials);
  }, []);

  // ---- state-setting wrappers (the key fix) ----
  const loadAppointmentsByTrial = async (trialId: string) => {
    const items = await fetchAppointmentsByTrial(trialId);
    setUniqueAppointments(items);
  };

  const loadTrialMedications = async (trialId: string) => {
    const items = await fetchTrialMedications(trialId);
    setUniqueTrialMeds(items);
  };

  useTabRefresh(() => {
    resetState();
    fetchTrials().then(setTrials);
    if (selectedTrialId) {
      loadAppointmentsByTrial(selectedTrialId);
      loadTrialMedications(selectedTrialId);
    }
  });

  const handleSaveAppointments = async () => {
    if (!selectedTrialId || !selectedAppt || !selectedField || !newFieldValue) {
      Alert.alert("Missing input", "Please complete all fields.");
      return;
    }
    const valueToUpdate =
      selectedField === "requirements"
        ? newFieldValue.split(",").map((v) => v.trim())
        : newFieldValue;

    try {
      await updateAllAppointments(
        selectedTrialId,
        selectedAppt.title,
        selectedField,
        valueToUpdate
      );
      Alert.alert(
        "Success",
        `Updated all "${selectedAppt.title}" appointments for this trial.`
      );
      resetState();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSaveMedications = async () => {
    if (!selectedTrialId || !selectedMassTrialMedId || !selectedMedField) return;
    const med = uniqueTrialMeds.find((m) => m.id === selectedMassTrialMedId);
    if (!med) return;

    try {
      await updateAllMedications(
        selectedTrialId,
        med.name,
        selectedMedField,
        newMedFieldValue
      );
      Alert.alert("Success", `Updated all "${med.name}" medications.`);
      await loadTrialMedications(selectedTrialId);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteAppointments = async () => {
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
            await deleteAllAppointments(selectedTrialId, selectedAppt.title);
            Alert.alert("Deleted", "All matching appointments removed.");
            resetState();
          },
        },
      ]
    );
  };

  const handleDeleteMedications = async () => {
    if (!selectedTrialId || !selectedMassTrialMedId) return;
    const med = uniqueTrialMeds.find((m) => m.id === selectedMassTrialMedId);
    if (!med) return;
    Alert.alert("Confirm Delete", `Delete all "${med.name}" medications?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteAllMedications(selectedTrialId, med.name);
          Alert.alert("Deleted", `All "${med.name}" medications removed.`);
          await loadTrialMedications(selectedTrialId);
        },
      },
    ]);
  };

  const resetState = () => {
    setSelectedTrialId(null);
    setUniqueAppointments([]);
    setUniqueTrialMeds([]);
    setSelectedAppt(null);
    setSelectedField("");
    setCurrentFieldValue("");
    setNewFieldValue("");
    setSelectedMassTrialMedId(null);
    setSelectedMedField("");
    setCurrentMedFieldValue("");
    setNewMedFieldValue("");
  };

  return {
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
    loadAppointmentsByTrial,
    loadTrialMedications,
  };
};
