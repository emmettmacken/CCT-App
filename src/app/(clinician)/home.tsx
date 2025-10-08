import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/clinicianHome.styles";

import AppointmentsSection from "../../components/ui/AppointmentsSection";
import QuickLinksSection from "../../components/ui/QuickLinksSection";

import { Appointment } from "../../types/clinician";

const ClinicianHomeScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const { data: appointmentsData, error } = await supabase
          .from("appointments")
          .select(`*, profiles ( name )`)
          .eq("date", todayStr)
          .order("time", { ascending: true });

        if (error) throw error;

        const formattedAppointments: Appointment[] =
          appointmentsData?.map((appt) => ({
            ...appt,
            patient_name: appt.profiles?.name || "Unknown Patient",
          })) || [];

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AppointmentsSection appointments={appointments} />
        <QuickLinksSection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClinicianHomeScreen;
