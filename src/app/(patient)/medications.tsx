import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { AddAdditionalMedModal } from "../../components/AddAdditionalMedModal";
import SideEffectModal from "../../components/AddSideEffect";
import PatientMedicationLogBook from "../../components/PatientMedicationLogBook";
import { AdditionalMedicationsSection } from "../../components/AdditionalMedicationsSection";
import { TrialMedicationsSection } from "../../components/TrialMedicationsSections";
import { useTabRefresh } from "../../hooks/useTabRefresh";
import { styles } from "../../styles/medications.styles";
import { AdditionalMedication, Medication } from "../../types/medications";

const MedicationTrackingScreen = () => {
  const [trialMedications, setTrialMedications] = useState<Medication[]>([]);
  const [additionalMeds, setAdditionalMeds] = useState<AdditionalMedication[]>(
    []
  );
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedTrialMed, setSelectedTrialMed] = useState<Medication | null>(
    null
  );
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [medToEdit, setMedToEdit] = useState<AdditionalMedication | null>(null);

  const [showSideEffectModal, setShowSideEffectModal] = useState(false);
  const [sideEffects, setSideEffects] = useState<any[]>([]);

  // Print range states
  const [printRangeEnabled, setPrintRangeEnabled] = useState(false);
  const [printStartDate, setPrintStartDate] = useState<Date | null>(null);
  const [printEndDate, setPrintEndDate] = useState<Date | null>(null);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);

  // Tab refresh hook
  useTabRefresh(fetchMedications);

  const isSameDate = (dateString: string, date: Date) => {
    const logDate = new Date(dateString);
    return (
      logDate.getDate() === date.getDate() &&
      logDate.getMonth() === date.getMonth() &&
      logDate.getFullYear() === date.getFullYear()
    );
  };

  const today = new Date();
  const todayTrialLogs = medicationLogs.filter(
    (log) => log.type === "trial" && isSameDate(log.taken_at, today)
  );
  const todayAdditionalLogs = medicationLogs.filter(
    (log) => log.type === "additional" && isSameDate(log.taken_at, today)
  );

  async function fetchMedications() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const currentUserId = sessionData.session.user.id;
    setUserId(currentUserId); // store userId
    const todayDateStr = new Date().toISOString().split("T")[0];

    // Fetch trial medications
    const { data: trialData, error: trialError } = await supabase
      .from("trial_medications")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("scheduled_date", todayDateStr);

    if (trialError)
      console.log("Error fetching trial meds:", trialError.message);
    else setTrialMedications(trialData || []);

    // Fetch additional medications
    const { data: additionalData, error: additionalError } = await supabase
      .from("additional_medications_logs")
      .select("*")
      .eq("user_id", currentUserId)
      .gte("taken_at", todayDateStr);

    if (additionalError)
      console.log("Error fetching additional meds:", additionalError.message);
    else setAdditionalMeds(additionalData || []);

    // Fetch medication logs
    const { data: trialLogsData, error: trialLogsError } = await supabase
      .from("trial_medication_logs")
      .select("*")
      .eq("user_id", currentUserId)
      .order("taken_at", { ascending: true });

    if (trialLogsError)
      console.log("Error fetching trial logs:", trialLogsError.message);

    const { data: additionalLogsData, error: additionalLogsError } =
      await supabase
        .from("additional_medications_logs")
        .select("*")
        .eq("user_id", currentUserId)
        .order("taken_at", { ascending: true });

    if (additionalLogsError)
      console.log(
        "Error fetching additional logs:",
        additionalLogsError.message
      );

    const allLogs = [
      ...(trialLogsData || []).map((l) => ({ ...l, type: "trial" })),
      ...(additionalLogsData || []).map((l) => ({ ...l, type: "additional" })),
    ];

    setMedicationLogs(allLogs);

    // Fetch side effects
    const { data: sideEffectsData, error: sideEffectsError } = await supabase
      .from("side_effects")
      .select("*")
      .eq("user_id", currentUserId)
      .order("start_date", { ascending: false })
      .gte("end_date", todayDateStr);

    if (sideEffectsError)
      console.log("Error fetching side effects:", sideEffectsError.message);
    else setSideEffects(sideEffectsData || []);

    setLoading(false);
  }

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
    if (!selectedTrialMed || !userId) return;

    const taken_at = new Date();
    taken_at.setHours(hours, minutes, 0);

    const { error } = await supabase.from("trial_medication_logs").insert({
      medication_id: selectedTrialMed.id,
      taken_at: taken_at.toISOString(),
      name: selectedTrialMed.name,
      user_id: userId,
    });

    if (error) console.log("Error logging medication:", error.message);
    else fetchMedications();

    setTimePickerVisible(false);
  };

  const handleAddOrEditMedication = (med?: AdditionalMedication) => {
    setMedToEdit(med || null);
    setShowAddMedModal(true);
  };

  const handlePrintLogs = async () => {
    let logsToPrint = medicationLogs;

    if (printRangeEnabled && printStartDate && printEndDate) {
      logsToPrint = medicationLogs.filter((log) => {
        const logDate = new Date(log.taken_at);
        return logDate >= printStartDate && logDate <= printEndDate;
      });
    }

    const trialLogs = logsToPrint.filter((l) => l.type === "trial");
    const additionalLogs = logsToPrint.filter((l) => l.type === "additional");

    let htmlContent = `<body style="font-family: Arial, sans-serif; padding: 20px;"><h1>Medication Log Book</h1>`;

    if (trialLogs.length > 0) {
      htmlContent += `<h2>Trial Medications</h2><ul>`;
      trialLogs.forEach((log) => {
        htmlContent += `<li><strong>${log.name}</strong> - ${new Date(
          log.taken_at
        ).toLocaleString()}</li>`;
      });
      htmlContent += `</ul>`;
    }

    if (additionalLogs.length > 0) {
      htmlContent += `<h2>Additional Medications</h2><ul>`;
      additionalLogs.forEach((log) => {
        htmlContent +=
          `<li><strong>${log.name}</strong>` +
          `${log.dosage ? ` - ${log.dosage}` : ""}` +
          `${log.reason ? ` | Reason: ${log.reason}` : ""}` +
          ` - ${new Date(log.taken_at).toLocaleString()}</li>`;
      });
      htmlContent += `</ul>`;
    }

    if (sideEffects.length > 0) {
      htmlContent += `<h2>Side Effects</h2><ul>`;
      sideEffects.forEach((se) => {
        htmlContent += `<li>${se.description || "N/A"}: ${
          se.medication_taken || "N/A"
        } (${new Date(se.start_date).toLocaleDateString()}${
          se.end_date ? ` - ${new Date(se.end_date).toLocaleDateString()}` : ""
        })</li>`;
      });
      htmlContent += `</ul>`;
    }

    htmlContent += `</body>`;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading medications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <FlatList
        data={medicationLogs}
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

            <TouchableOpacity
              style={{
                padding: 12,
                marginVertical: 12,
                backgroundColor: "#3f51b5",
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => setShowSideEffectModal(true)}
            >
              <Text style={{ fontWeight: "bold", color: "#ffff" }}>
                Report Side Effect
              </Text>
            </TouchableOpacity>

            {sideEffects.length > 0 && (
              <View
                style={{
                  marginVertical: 12,
                  padding: 12,
                  backgroundColor: "#f0f4ff",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: "bold", marginBottom: 6 }}>
                  Added Side Effects:
                </Text>
                {sideEffects.map((se) => (
                  <View key={se.id} style={{ marginBottom: 8 }}>
                    <Text>Description: {se.description}</Text>
                    <Text>Medication: {se.medication_taken || "N/A"}</Text>
                    <Text>
                      Start: {new Date(se.start_date).toLocaleString()}
                    </Text>
                    {se.end_date && (
                      <Text>End: {new Date(se.end_date).toLocaleString()}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <AdditionalMedicationsSection
              additionalMeds={additionalMeds}
              medicationLogs={todayAdditionalLogs}
              onAddPress={handleAddOrEditMedication}
            />

            <PatientMedicationLogBook patientId={userId ?? ""} />

            <View style={{ marginVertical: 12 }}>
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: "#3f51b5",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                onPress={handlePrintLogs}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Print All Logs
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text>Print Select Range:</Text>
                <Switch
                  value={printRangeEnabled}
                  onValueChange={setPrintRangeEnabled}
                  style={{ marginLeft: 8 }}
                />
              </View>

              {printRangeEnabled && (
                <View>
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      backgroundColor: "#4CAF50",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    onPress={() => setStartDatePickerVisible(true)}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {printStartDate
                        ? printStartDate.toDateString()
                        : "Select Start Date"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      padding: 10,
                      backgroundColor: "#4CAF50",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    onPress={() => setEndDatePickerVisible(true)}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {printEndDate
                        ? printEndDate.toDateString()
                        : "Select End Date"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      padding: 10,
                      backgroundColor: "#3f51b5",
                      borderRadius: 8,
                    }}
                    onPress={handlePrintLogs}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Print Range of Logs
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        }
        renderItem={() => null}
        contentContainerStyle={styles.scrollContainer}
      />

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
        hours={new Date().getHours()}
        minutes={new Date().getMinutes()}
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={startDatePickerVisible}
        onDismiss={() => setStartDatePickerVisible(false)}
        date={printStartDate || new Date()}
        onConfirm={(params) => {
          setPrintStartDate(params.date ?? null);
          setStartDatePickerVisible(false);
        }}
        presentationStyle="pageSheet"
        animationType="slide"
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={endDatePickerVisible}
        onDismiss={() => setEndDatePickerVisible(false)}
        date={printEndDate || new Date()}
        onConfirm={(params) => {
          setPrintEndDate(params.date ?? null);
          setEndDatePickerVisible(false);
        }}
        presentationStyle="pageSheet"
        animationType="slide"
      />

      <AddAdditionalMedModal
        visible={showAddMedModal}
        onClose={() => {
          setShowAddMedModal(false);
          setMedToEdit(null);
        }}
        refreshMeds={(meds: AdditionalMedication[]) => setAdditionalMeds(meds)}
        medToEdit={medToEdit}
      />

      <SideEffectModal
        visible={showSideEffectModal}
        onDismiss={() => {
          setShowSideEffectModal(false);
          fetchMedications();
        }}
      />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default MedicationTrackingScreen;
