import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../backend/supabaseClient";
import { useTabRefresh } from "../../hooks/useTabRefresh";
import { styles } from "../../styles/appointments.styles";

type Appointment = {
  id: string;
  user_id: string;
  date: string;
  time: string | null;
  title: string;
  location: string | null;
  requirements: string[] | null;
  category: string | null;
  fasting_required: boolean;
};

export default function PatientCalendarScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editable time state
  const [editingTime, setEditingTime] = useState(false);
  const [patientTime, setPatientTime] = useState<string | null>(null);

  // Fetch appointments function
  const fetchAppointments = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      setLoading(false);
      return;
    }

    setAppointments(data || []);
    setLoading(false);
  }, []);

  useTabRefresh(fetchAppointments);

  // Initial fetch on mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    appointments.forEach((appt) => {
      marks[appt.date] = {
        marked: true,
        dotColor: "#007AFF",
        selected: appt.date === selectedDate,
      };
    });
    return marks;
  }, [appointments, selectedDate]);

  // Handle date selection
  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setCurrentIndex(0);
    setModalVisible(true);
  };

  const selectedDayAppointments = appointments.filter(
    (appt) => appt.date === selectedDate
  );

  const currentAppointment =
    selectedDayAppointments.length > 0
      ? selectedDayAppointments[currentIndex]
      : null;

  // Determine earliest time for the day
  const earliestTime = (() => {
    const times = selectedDayAppointments
      .map((a) => a.time)
      .filter((t): t is string => !!t);
    if (times.length === 0) return null;
    return times.sort((a, b) => a.localeCompare(b))[0];
  })();

  // Reset patientTime when changing appointment
  useEffect(() => {
    if (currentAppointment) {
      setPatientTime(currentAppointment.time);
      setEditingTime(false);
    }
  }, [currentAppointment]);

  const nextAppointment = () => {
    if (selectedDayAppointments.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % selectedDayAppointments.length);
    }
  };

  const prevAppointment = () => {
    if (selectedDayAppointments.length > 0) {
      setCurrentIndex(
        (prev) =>
          (prev - 1 + selectedDayAppointments.length) %
          selectedDayAppointments.length
      );
    }
  };

  // Save patient-entered time to Supabase
  const handleSaveTime = async () => {
    if (!currentAppointment || !patientTime) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ time: patientTime })
        .eq("id", currentAppointment.id);

      if (error) throw error;

      // Update local state to reflect new time
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === currentAppointment.id ? { ...a, time: patientTime } : a
        )
      );
      setEditingTime(false);
    } catch (err) {
      console.error("Error saving time:", err);
    }
  };

  const formatTime = (timeStr: string) => {
    // Simple formatting HH:MM
    return timeStr;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        My Appointments
      </Text>
      <Text style={styles.subtitle}>Tap on a date to view details</Text>
      <Text style={styles.attendance}>
        If you cannot attend your scheduled appointment, please contact Clinical
        Trials Office at{" "}
        <Text style={styles.contactDetail}>
          <Text
            style={{ color: "blue", textDecorationLine: "underline" }}
            onPress={() =>
              Alert.alert("Call", "Do you want to ring (087) 382 4221?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Ring",
                  onPress: () => Linking.openURL("tel:0871234567"),
                },
              ])
            }
          >
            (087) 382 4221
          </Text>
        </Text>
      </Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 40 }}
        />
      ) : (
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          firstDay={1}
          theme={{
            selectedDayBackgroundColor: "#007AFF",
            todayTextColor: "#007AFF",
            arrowColor: "#007AFF",
            dotColor: "#007AFF",
          }}
        />
      )}

      {/* Appointment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              width: "100%",
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}>
              {selectedDate}
            </Text>

            {currentAppointment ? (
              <>
                <Text style={{ fontSize: 18, fontWeight: "500" }}>
                  {currentAppointment.title}
                </Text>

                {/* Editable Time */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Text style={{ fontWeight: "600", marginRight: 6 }}>
                    Time:
                  </Text>
                  {editingTime ? (
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        padding: 6,
                        minWidth: 100,
                      }}
                      placeholder="HH:MM (24h)"
                      value={patientTime || ""}
                      onChangeText={setPatientTime}
                      onSubmitEditing={handleSaveTime}
                      onBlur={handleSaveTime}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setEditingTime(true)}>
                      <Text style={{ color: patientTime ? "#000" : "#999" }}>
                        {patientTime
                          ? formatTime(patientTime)
                          : "Enter time given by clinic"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={{ marginTop: 6 }}>
                  Location:{" "}
                  {currentAppointment.location ||
                    "University Hospital Limerick"}
                </Text>
                <Text>
                  Category: {currentAppointment.category || "General"}
                </Text>
                {currentAppointment.requirements && (
                  <Text>
                    Requirements: {currentAppointment.requirements.join(", ")}
                  </Text>
                )}
                {currentAppointment.fasting_required && (
                  <Text
                    style={{ marginTop: 6, fontWeight: "700", color: "green" }}
                  >
                    Fasting required for this appointment.
                  </Text>
                )}

                {/* Navigation for multiple appointments */}
                {selectedDayAppointments.length > 1 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 20,
                      justifyContent: "space-between",
                      width: "60%",
                    }}
                  >
                    <TouchableOpacity onPress={prevAppointment}>
                      <Ionicons
                        name="chevron-back-circle"
                        size={36}
                        color="#007AFF"
                      />
                    </TouchableOpacity>
                    <Text>
                      {currentIndex + 1} / {selectedDayAppointments.length}
                    </Text>
                    <TouchableOpacity onPress={nextAppointment}>
                      <Ionicons
                        name="chevron-forward-circle"
                        size={36}
                        color="#007AFF"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <Text>No appointments for this day.</Text>
            )}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 25,
                backgroundColor: "#007AFF",
                paddingVertical: 10,
                paddingHorizontal: 30,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
