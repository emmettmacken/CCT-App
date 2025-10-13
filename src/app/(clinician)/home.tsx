import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/clinicianHome.styles";
import AppointmentsSection from "../../components/ui/AppointmentsSection";
import QuickLinksSection from "../../components/ui/QuickLinksSection";
import { Appointment } from "../../types/clinician";
import { useTabRefresh } from "../../hooks/useTabRefresh"; 

const ClinicianHomeScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setUserName(profileData?.name || "User");

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

  useEffect(() => {
    fetchData();
  }, []);

  useTabRefresh(fetchData);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading information...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{userName}</Text>
          </View>
        </View>
        <AppointmentsSection appointments={appointments} />
        <QuickLinksSection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClinicianHomeScreen;
