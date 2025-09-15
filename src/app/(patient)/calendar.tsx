import React, { useEffect, useState } from "react";
import { SafeAreaView, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../backend/supabaseClient";
import AppointmentModal from "../../components/AppointmentModal";
import { styles } from "../../styles/appointments.styles";
import { Appointment } from "../../types/appointments";
import { useLocalSearchParams } from "expo-router";

const CalendarScreen = () => {
  const [appointments, setAppointments] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase.from("appointments").select("*");

        if (error) {
          console.error("Error fetching appointments:", error);
          return;
        }

        if (data) {
          const now = new Date();

          const formattedAppointments = data.reduce(
            (acc: Record<string, any>, appt: any) => {
              const dateTime = `${appt.date}T${appt.time}`;
              const isPast = dateTime < now.toISOString();

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
                  text: { color: "#ffffff" },
                },
                appointmentData: {
                  ...appt,
                  dateTime,
                },
              };
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
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [date, id]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const appointmentEntry = appointments[day.dateString];
    if (appointmentEntry?.appointmentData) {
      setSelectedAppointment(appointmentEntry.appointmentData);
      setModalVisible(true);
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
        Trials Office at 087 382 4221 at your earliest convenience
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
        onClose={() => setModalVisible(false)}
        appointment={selectedAppointment}
      />
    </SafeAreaView>
  );
};

export default CalendarScreen;