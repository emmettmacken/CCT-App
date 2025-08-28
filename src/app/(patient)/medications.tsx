import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TimePickerModal, DatePickerModal } from "react-native-paper-dates";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/medications.styles";
import { Medication, AdditionalMedication } from "../../types/medications";

import { MaterialIcons } from "@expo/vector-icons";
import { AddAdditionalMedModal } from "../../components/AddAdditionalMedModal";
import { AdditionalMedicationsSection } from "../../components/ui/AdditionalMedicationsSection";
import { TrialMedicationsSection } from "../../components/ui/TrialMedicationsSections";

const MedicationTrackingScreen = () => {
  const [trialMedications, setTrialMedications] = useState<Medication[]>([]);
  const [additionalMeds, setAdditionalMeds] = useState<AdditionalMedication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrialMed, setSelectedTrialMed] = useState<Medication | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [logBookExpanded, setLogBookExpanded] = useState(false);
  const [logType, setLogType] = useState<"trial" | "additional">("trial");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const isSameDate = (dateString: string, date: Date) => {
    const logDate = new Date(dateString);
    return (
      logDate.getDate() === date.getDate() &&
      logDate.getMonth() === date.getMonth() &&
      logDate.getFullYear() === date.getFullYear()
    );
  };

  const todayTrialLogs = medicationLogs.filter(
    (log) =>
      log.type === "trial" &&
      selectedDate &&
      isSameDate(log.taken_at, selectedDate)
  );

  const todayAdditionalLogs = medicationLogs.filter(
    (log) =>
      log.type === "additional" &&
      selectedDate &&
      isSameDate(log.taken_at, selectedDate)
  );

  const fetchMedications = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    // Fetch trial medications
    const { data: trialData, error: trialError } = await supabase
      .from("trial_medications")
      .select("*")
      .eq("user_id", userId);

    if (trialError) {
      console.log("Error fetching trial meds:", trialError.message);
    } else {
      setTrialMedications(trialData || []);
    }

    // Fetch additional medications
    const { data: additionalData, error: additionalError } = await supabase
      .from("additional_medications_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("taken_at", new Date().toISOString().split("T")[0]);

    if (additionalError) {
      console.log("Error fetching additional meds:", additionalError.message);
    } else {
      setAdditionalMeds(additionalData || []);
    }

    // Fetch trial logs
    const { data: trialLogsData, error: trialLogsError } = await supabase
      .from("trial_medication_logs")
      .select("*")
      .eq("user_id", userId)
      .order("taken_at", { ascending: true });

    if (trialLogsError) {
      console.log("Error fetching trial logs:", trialLogsError.message);
    }

    // Fetch additional
    const { data: additionalLogsData, error: additionalLogsError } =
      await supabase
        .from("additional_medications_logs")
        .select("*")
        .eq("user_id", userId)
        .order("taken_at", { ascending: true });

    if (additionalLogsError) {
      console.log("Error fetching additional logs:", additionalLogsError.message);
    }

    // Merge trial + additional logs
    const allLogs = [
      ...(trialLogsData || []).map((l) => ({ ...l, type: "trial" })),
      ...(additionalLogsData || []).map((l) => ({ ...l, type: "additional" })),
    ];

    setMedicationLogs(allLogs);

    setLoading(false);
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleTimeConfirm = async ({
    hours,
    minutes,
  }: {
    hours: number;
    minutes: number;
  }) => {
    if (!selectedTrialMed) return;

    const taken_at = new Date();
    taken_at.setHours(hours, minutes, 0);

    const { error } = await supabase.from("trial_medication_logs").insert({
      medication_id: selectedTrialMed.id,
      dosage: selectedTrialMed.dosage,
      taken_at: taken_at.toISOString(),
      name: selectedTrialMed.name,
      user_id: (await supabase.auth.getUser())?.data.user?.id,
    });

    if (error) {
      console.log("Error logging medication:", error.message);
    } else {
      fetchMedications();
    }
    setTimePickerVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading medications...</Text>
      </SafeAreaView>
    );
  }

  const filteredLogs = medicationLogs.filter(
    (log) => log.type === logType && selectedDate && isSameDate(log.taken_at, selectedDate)
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <TrialMedicationsSection
              trialMedications={trialMedications}
              medicationLogs={todayTrialLogs}
              selectedTrialMed={selectedTrialMed}
              setSelectedTrialMed={setSelectedTrialMed}
              onLogPress={() => setTimePickerVisible(true)}
            />

            <AdditionalMedicationsSection
              additionalMeds={additionalMeds}
              medicationLogs={todayAdditionalLogs}
              onAddPress={() => setShowAddMedModal(true)}
            />

            {/* Collapsible Log Book Header */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginVertical: 12,
                padding: 10,
                backgroundColor: "#e8e8e8",
                borderRadius: 8,
              }}
              onPress={() => setLogBookExpanded(!logBookExpanded)}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Medication Log Book
              </Text>
              <MaterialIcons
                name={
                  logBookExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"
                }
                size={28}
                color="black"
              />
            </TouchableOpacity>

            {logBookExpanded && (
              <>
                {/* Date Picker */}
                <TouchableOpacity
                  style={{
                    padding: 10,
                    backgroundColor: "#4CAF50",
                    borderRadius: 8,
                    marginBottom: 12,
                    alignSelf: "center",
                  }}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {selectedDate
                      ? selectedDate.toDateString()
                      : "Select a Date"}
                  </Text>
                </TouchableOpacity>

                {/* Toggle between Trial vs Additional logs */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: logType === "trial" ? "#4CAF50" : "#ccc",
                      borderRadius: 8,
                      marginHorizontal: 5,
                    }}
                    onPress={() => setLogType("trial")}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Trial Logs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor:
                        logType === "additional" ? "#4CAF50" : "#ccc",
                      borderRadius: 8,
                      marginHorizontal: 5,
                    }}
                    onPress={() => setLogType("additional")}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Additional Logs
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        }
        renderItem={({ item }) =>
          logBookExpanded ? (
            <View
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 8,
                backgroundColor: "#f3f3f3",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                {logType === "trial"
                  ? "Trial Medication"
                  : "Additional Medication"}
              </Text>
              <Text>Name: {item.name}</Text>
              <Text>Dosage: {item.dosage}</Text>
              <Text>Time: {new Date(item.taken_at).toLocaleString()}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          logBookExpanded ? <Text>No {logType} logs found.</Text> : null
        }
        contentContainerStyle={styles.scrollContainer}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
        hours={new Date().getHours()}
        minutes={new Date().getMinutes()}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        locale="en"
        mode="single"
        visible={datePickerVisible}
        onDismiss={() => setDatePickerVisible(false)}
        date={selectedDate || new Date()}
        onConfirm={(params) => {
          setSelectedDate(params.date);
          setDatePickerVisible(false);
        }}
      />

      {/* Add Additional Medication Modal */}
      <AddAdditionalMedModal
        visible={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        refreshMeds={(meds: AdditionalMedication[]) =>
          setAdditionalMeds(meds)
        }
      />
    </SafeAreaView>
  );
};

export default MedicationTrackingScreen;