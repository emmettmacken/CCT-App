import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { supabase } from "../../backend/supabaseClient";

interface PatientMedicationLogBookProps {
  patientId: string;
}

const PatientMedicationLogBook: React.FC<PatientMedicationLogBookProps> = ({
  patientId,
}) => {
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [sideEffects, setSideEffects] = useState<any[]>([]);
  const [logBookExpanded, setLogBookExpanded] = useState(false); // starts closed
  const [logType, setLogType] = useState<
    "trial" | "additional" | "side_effects"
  >("trial");
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

  const fetchPatientLogs = async () => {
    if (!patientId) return;

    console.log("Fetching logs for patientId:", patientId);

    // Fetch trial logs
    const { data: trialLogsData, error: trialError } = await supabase
      .from("trial_medication_logs")
      .select("*")
      .eq("user_id", patientId)
      .order("taken_at", { ascending: true });

    if (trialError) console.log("Error fetching trial logs:", trialError);
    console.log("Trial logs fetched:", trialLogsData);

    // Fetch additional logs
    const { data: additionalLogsData, error: additionalError } = await supabase
      .from("additional_medications_logs")
      .select("*")
      .eq("user_id", patientId)
      .order("taken_at", { ascending: true });

    if (additionalError)
      console.log("Error fetching additional logs:", additionalError);
    console.log("Additional logs fetched:", additionalLogsData);

    // Merge and tag logs
    setMedicationLogs([
      ...(trialLogsData || []).map((l) => ({ ...l, type: "trial" })),
      ...(additionalLogsData || []).map((l) => ({ ...l, type: "additional" })),
    ]);

    // Fetch side effects
    const { data: sideEffectsData, error: sideEffectsError } = await supabase
      .from("side_effects")
      .select("*")
      .eq("user_id", patientId)
      .order("start_date", { ascending: false });

    if (sideEffectsError)
      console.log("Error fetching side effects:", sideEffectsError);
    console.log("Side effects fetched:", sideEffectsData);

    setSideEffects(sideEffectsData || []);
  };

  useEffect(() => {
    fetchPatientLogs();
  }, [patientId]);

  const filteredLogs =
    logType === "trial" || logType === "additional"
      ? medicationLogs.filter(
          (log) =>
            log.type === logType &&
            selectedDate &&
            isSameDate(log.taken_at, selectedDate)
        )
      : [];

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Collapsible header */}
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
          name={logBookExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
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
              {selectedDate ? selectedDate.toDateString() : "Select a Date"}
            </Text>
          </TouchableOpacity>

          {/* Toggle Trial / Additional / Side Effects */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {["trial", "additional", "side_effects"].map((type) => (
              <TouchableOpacity
                key={type}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: logType === type ? "#4CAF50" : "#ccc",
                  borderRadius: 8,
                  marginHorizontal: 5,
                }}
                onPress={() => setLogType(type as any)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {type === "trial"
                    ? "Trial Logs"
                    : type === "additional"
                    ? "Additional Logs"
                    : "Side Effects"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Display logs or side effects */}
          {logType === "trial" || logType === "additional" ? (
            <FlatList
              data={filteredLogs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
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
                  {logType === "additional" && item.dosage && (
                    <Text>Dosage: {item.dosage}</Text>
                  )}
                  {logType === "additional" && item.reason && (
                    <Text>Reason: {item.reason}</Text>
                  )}
                  <Text>Time: {new Date(item.taken_at).toLocaleString()}</Text>
                </View>
              )}
              ListEmptyComponent={<Text>No {logType} logs found.</Text>}
            />
          ) : (
            <FlatList
              data={sideEffects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: "#f3f3f3", // match trial/additional log background
                  }}
                >
                  <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                    Side Effect
                  </Text>
                  <Text>Description: {item.description || "N/A"}</Text>
                  <Text>Medication: {item.medication_taken || "N/A"}</Text>
                  <Text>
                    Start: {new Date(item.start_date).toLocaleString()}
                  </Text>
                  {item.end_date && (
                    <Text>End: {new Date(item.end_date).toLocaleString()}</Text>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text>No side effects found.</Text>}
            />
          )}

          {/* Date picker modal */}
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
        </>
      )}
    </View>
  );
};

export default PatientMedicationLogBook;
