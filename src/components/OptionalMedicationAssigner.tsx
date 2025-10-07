import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Button, Card } from "react-native-paper";
import { supabase } from "../../backend/supabaseClient";
import { addDays } from "date-fns";

const OptionalMedicationAssigner = ({ patientId }: { patientId: string }) => {
  const [visible, setVisible] = useState(false);
  const [optionalMeds, setOptionalMeds] = useState<any[]>([]);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOptionalMeds = async () => {
    setLoading(true);
    try {
      // Fetch patient trial
      const { data: patientTrial, error: ptError } = await supabase
        .from("patient_trials")
        .select("trial_id, start_date, id")
        .eq("patient_id", patientId)
        .single();

      if (ptError || !patientTrial) {
        Alert.alert("No Trial", "Patient must be assigned a trial first.");
        setLoading(false);
        return;
      }

      const { trial_id, start_date, id: patientTrialId } = patientTrial;

      // Fetch optional meds for that trial
      const { data: meds, error: medsError } = await supabase
        .from("trial_optional_medications")
        .select("*")
        .eq("trial_id", trial_id);

      if (medsError) throw medsError;

      if (!meds || meds.length === 0) {
        Alert.alert("No Optional Medications", "There are no optional medications for this trial.");
        setLoading(false);
        return;
      }

      // Store meds for modal
      setOptionalMeds(meds);
      setVisible(true);
    } catch (err) {
      console.error("Error fetching optional meds:", err);
      Alert.alert("Error", "Failed to fetch optional medications.");
    } finally {
      setLoading(false);
    }
  };

  const applyOptionalMedication = async () => {
    if (!selectedMed) {
      Alert.alert("Select a Medication", "Please select one optional medication to apply.");
      return;
    }

    try {
      const { data: patientTrial } = await supabase
        .from("patient_trials")
        .select("trial_id, start_date, id")
        .eq("patient_id", patientId)
        .single();

      if (!patientTrial) {
        Alert.alert("No Trial", "Patient must be assigned a trial first.");
        return;
      }

      const { trial_id, start_date, id: patientTrialId } = patientTrial;

      // Fetch trial info
      const { data: trialRow, error: trialError } = await supabase
        .from("trials")
        .select("cycle_duration_days, number_of_cycles")
        .eq("id", trial_id)
        .single();

      if (trialError || !trialRow) throw trialError;

      const { cycle_duration_days, number_of_cycles } = trialRow;
      const startDate = new Date(start_date);

      const applicableCycles = Array.isArray(selectedMed.applicable_cycles)
        ? selectedMed.applicable_cycles
        : [];
      const scheduledDays = Array.isArray(selectedMed.scheduled_days)
        ? selectedMed.scheduled_days
        : [];

      const medsToInsert: any[] = [];

      applicableCycles.forEach((cycle: number) => {
        scheduledDays.forEach((dayNum: number) => {
          const offset = (cycle - 1) * cycle_duration_days + (dayNum - 1);
          const medDate = addDays(startDate, offset);
          medsToInsert.push({
            user_id: patientId,
            name: selectedMed.drug_name,
            frequency: selectedMed.frequency,
            scheduled_date: medDate.toISOString().split("T")[0],
            created_at: new Date().toISOString(),
            notes: selectedMed.special_conditions || null,
            patient_trial_id: patientTrialId,
          });
        });
      });

      if (medsToInsert.length === 0) {
        Alert.alert("Error", "No valid medication schedule found.");
        return;
      }

      const { error: insertError } = await supabase
        .from("trial_medications")
        .insert(medsToInsert);

      if (insertError) throw insertError;

      Alert.alert("Success", "Optional medication assigned successfully!");
      setVisible(false);
      setSelectedMed(null);
    } catch (err) {
      console.error("Error assigning optional med:", err);
      Alert.alert("Error", "Could not assign optional medication.");
    }
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <Button
        mode="contained"
        onPress={fetchOptionalMeds}
        loading={loading}
        style={{ backgroundColor: "#47b53fff" }}
      >
        Apply Optional Medications
      </Button>

      <Modal visible={visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Card style={{ width: "85%", padding: 16 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
              Select an Optional Medication
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {optionalMeds.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  onPress={() => setSelectedMed(med)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      selectedMed?.id === med.id ? "#2196F3" : "#ccc",
                    backgroundColor:
                      selectedMed?.id === med.id ? "#E3F2FD" : "#fff",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>{med.drug_name}</Text>
                  <Text>Frequency: {med.frequency}</Text>
                  <Text>Conditions: {med.special_conditions || "None"}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <Button onPress={() => setVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={applyOptionalMedication}>
                Apply
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

export default OptionalMedicationAssigner;
