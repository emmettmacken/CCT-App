import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../backend/supabaseClient";
import AppointmentModal from "../../components/AppointmentModal";
import { styles } from "../../styles/appointments.styles";
import { Appointment } from "../../types/appointments";
import * as Linking from "expo-linking";

const CalendarScreen = () => {
  const [appointments, setAppointments] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const { date } = useLocalSearchParams<{ date?: string }>();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase.from("appointments").select("*");
        if (error) {
          console.error("[CalendarScreen] Supabase error:", error);
          return;
        }

        const now = new Date();

        const formattedAppointments = data?.reduce(
          (acc: Record<string, any>, appt: any) => {
            if (!appt.date) return acc;

            const apptDateObj = appt.time
              ? new Date(`${appt.date}T${appt.time}`)
              : new Date(appt.date);
            const isPast = apptDateObj < now;

            if (!acc[appt.date]) {
              acc[appt.date] = {
                customStyles: {
                  container: {
                    backgroundColor: isPast ? "#b0b0b0" : "#3f51b5",
                    borderRadius: 20,
                    width: 36,
                    height: 36,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                  text: { color: "#fff" },
                },
                appointmentData: {
                  title: "",
                  time: "",
                  location: appt.location || "",
                  date: appt.date,
                  patientName: "",
                  requirements: [] as string[],
                },
                marked: true,
              };
            }

            const apptData = acc[appt.date].appointmentData;

            // Concatenate titles and times
            apptData.title += (apptData.title ? ", " : "") + appt.title;
            apptData.time += (apptData.time ? ", " : "") + (appt.time || "");
            apptData.patientName +=
              (apptData.patientName ? ", " : "") +
              (appt.profiles?.name || "Unknown");

            // Location only once per date
            apptData.location = apptData.location || appt.location || "";

            // Join all requirements
            if (appt.requirements && Array.isArray(appt.requirements)) {
              apptData.requirements = apptData.requirements
                ? [...apptData.requirements, ...appt.requirements]
                : [...appt.requirements];
            }

            return acc;
          },
          {}
        );

        setAppointments(formattedAppointments);

        if (date && formattedAppointments[date]) {
          setSelectedDate(date);
          setSelectedAppointment(formattedAppointments[date].appointmentData);
          setModalVisible(true);
        }
      } catch (err) {
        console.error("fetchAppointments error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [date]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const entry = appointments[day.dateString];
    if (entry?.appointmentData) {
      setSelectedAppointment(entry.appointmentData);
      setModalVisible(true);
    } else {
      setSelectedAppointment(null);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading calendar...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Appointments</Text>
      <Text style={styles.subtitle}>Tap on a date to view details</Text>
      <Text style={styles.attendance}>
        If you cannot attend your scheduled appointment, please contact Clinical
        Trials Office at <Text style={styles.contactDetail}>
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
      <Calendar
        current={date || new Date().toISOString().split("T")[0]}
        minDate={new Date().toISOString().split("T")[0]}
        maxDate={"2050-12-31"}
        markingType={"custom"}
        markedDates={appointments}
        onDayPress={handleDayPress}
        firstDay={1}
        theme={{
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#3f51b5",
          selectedDayBackgroundColor: "#3f51b5",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#3f51b5",
          dayTextColor: "#2d4150",
          textDisabledColor: "#d9e1e8",
          dotColor: "#3f51b5",
          selectedDotColor: "#ffffff",
          arrowColor: "#3f51b5",
          monthTextColor: "#3f51b5",
          indicatorColor: "#3f51b5",
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
        style={styles.calendar}
      />

      <AppointmentModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </SafeAreaView>
  );
};

export default CalendarScreen;
