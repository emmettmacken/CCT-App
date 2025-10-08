import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../backend/supabaseClient";

type Appointment = {
  id: string;
  user_id: string;
  date: string;
  time: string | null;
  title: string;
  location: string | null;
  requirements: string[] | null;
  category: string | null;
  patient_name?: string;
};

type GroupedAppointments = {
  patient_name: string;
  appointments: Appointment[];
};

export default function ClinicianCalendarScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch appointments joined with patient names
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*, profiles(name)")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
        return;
      }

      const formatted = data.map((appt: any) => ({
        ...appt,
        patient_name: appt.profiles?.name || "Unknown Patient",
      }));

      setAppointments(formatted);
      setFilteredAppointments(formatted);
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  // Filter by patient name
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAppointments(appointments);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredAppointments(
        appointments.filter((a) =>
          a.patient_name?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchQuery, appointments]);

  // Marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    filteredAppointments.forEach((appt) => {
      marks[appt.date] = {
        marked: true,
        dotColor: "#007AFF",
        selected: appt.date === selectedDate,
      };
    });
    return marks;
  }, [filteredAppointments, selectedDate]);

  // Handle date selection
  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setCurrentIndex(0);
    setModalVisible(true);
  };

  const route = useRoute<any>();
  const { patient, autoOpen, date } = route.params || {};

  useEffect(() => {
    if (autoOpen && patient && date) {
      setSearchQuery(patient);
      setSelectedDate(date);
      setModalVisible(true);
    }
  }, [autoOpen, patient, date]);

  // Group appointments by patient for the selected date
  const groupedAppointments: GroupedAppointments[] = useMemo(() => {
    const sameDay = filteredAppointments.filter((a) => a.date === selectedDate);
    const grouped: Record<string, Appointment[]> = {};
    sameDay.forEach((appt) => {
      const key = appt.patient_name || "Unknown Patient";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(appt);
    });
    return Object.keys(grouped).map((patient_name) => ({
      patient_name,
      appointments: grouped[patient_name],
    }));
  }, [filteredAppointments, selectedDate]);

  const currentGroup =
    groupedAppointments.length > 0 ? groupedAppointments[currentIndex] : null;

  const nextPatient = () => {
    if (groupedAppointments.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % groupedAppointments.length);
    }
  };

  const prevPatient = () => {
    if (groupedAppointments.length > 0) {
      setCurrentIndex(
        (prev) =>
          (prev - 1 + groupedAppointments.length) % groupedAppointments.length
      );
    }
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
        Calendar
      </Text>

      <TextInput
        placeholder="Search by patient name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
        }}
      />

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

      {/* Modal for grouped appointments */}
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
              maxHeight: "80%",
              padding: 20,
            }}
          >
            <ScrollView>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {selectedDate}
              </Text>

              {currentGroup ? (
                <>
                  <Text
                    style={{ fontSize: 18, fontWeight: "500", marginBottom: 8 }}
                  >
                    Patient: {currentGroup.patient_name}
                  </Text>

                  {/* Show all appointment titles */}
                  <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                    Appointments:
                  </Text>
                  {currentGroup.appointments.map((appt) => (
                    <Text key={appt.id}>• {appt.title}</Text>
                  ))}

                  {/* Location (show first appointment’s location) */}
                  {currentGroup.appointments[0]?.location && (
                    <Text style={{ marginTop: 10 }}>
                      Location: {currentGroup.appointments[0].location}
                    </Text>
                  )}

                  {/* Earliest time (show only if any time exists) */}
                  {(() => {
                    const times = currentGroup.appointments
                      .map((a) => a.time)
                      .filter((t): t is string => !!t); // keep only non-null
                    if (times.length === 0) return null;
                    const earliestTime = times.sort((a, b) =>
                      a.localeCompare(b)
                    )[0];
                    return (
                      <Text style={{ marginTop: 10 }}>
                        Time: {earliestTime}
                      </Text>
                    );
                  })()}

                  {/* Combined requirements */}
                  {currentGroup.appointments.some(
                    (a) => a.requirements?.length
                  ) && (
                    <Text style={{ marginTop: 10 }}>
                      Requirements:{" "}
                      {[
                        ...new Set(
                          currentGroup.appointments.flatMap(
                            (a) => a.requirements || []
                          )
                        ),
                      ].join(", ")}
                    </Text>
                  )}

                  {/* Categories (unique) */}
                  {currentGroup.appointments.some((a) => a.category) && (
                    <Text style={{ marginTop: 10 }}>
                      Categories:{" "}
                      {[
                        ...new Set(
                          currentGroup.appointments
                            .map((a) => a.category)
                            .filter(Boolean)
                        ),
                      ].join(", ")}
                    </Text>
                  )}

                  {/* Patient navigation if multiple patients on same day */}
                  {groupedAppointments.length > 1 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 20,
                        justifyContent: "space-between",
                        width: "60%",
                        alignSelf: "center",
                      }}
                    >
                      <TouchableOpacity onPress={prevPatient}>
                        <Ionicons
                          name="chevron-back-circle"
                          size={36}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                      <Text>
                        {currentIndex + 1} / {groupedAppointments.length}
                      </Text>
                      <TouchableOpacity onPress={nextPatient}>
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
                <Text style={{ textAlign: "center" }}>
                  No appointments for this day.
                </Text>
              )}

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  marginTop: 25,
                  backgroundColor: "#007AFF",
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 10,
                  alignSelf: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
