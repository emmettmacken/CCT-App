import { router, Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/home.styles";

interface Appointment {
  id: string;
  date: string;
  time: string;
  title: string;
  location: string;
  requirements: string[];
}

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-\n${year}`;
};

const formatTime = (timeStr: string) => {
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

// Constants for trial
const CYCLE_LENGTH = 42; // days
const NUM_CYCLES = 4;

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialProgress, setTrialProgress] = useState(0);
  const [trialPhase, setTrialPhase] = useState("Cycle 1");

  // TODO: Replace with actual trial start date from Supabase
  const trialStartDate = new Date("2025-08-01");

  const updateTrialProgress = () => {
    const today = new Date();
    const diffTime = today.getTime() - trialStartDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate total progress percentage
    const totalDays = CYCLE_LENGTH * NUM_CYCLES;
    const progress = Math.min((diffDays / totalDays) * 100, 100);

    // Determine current cycle
    const currentCycle = Math.min(Math.floor(diffDays / CYCLE_LENGTH) + 1, NUM_CYCLES);

    setTrialProgress(progress);
    setTrialPhase(`Cycle ${currentCycle}`);
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/(auth)/login");
      } else {
        const userId = data.session.user.id;

        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", userId)
          .single();

        if (userError) {
          console.log("Error fetching user info:", userError.message);
          setUser({ name: data.session.user.email });
        } else {
          setUser(userData);
        }

        fetchAppointments(userId);
        updateTrialProgress();
      }
    };

    const fetchAppointments = async (userId: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) {
        console.log("Error fetching appointments:", error.message);
        setAppointments([]);
      } else if (data) {
        const now = new Date();
        const upcoming = data.filter((appt: any) => {
          const apptDateTime = new Date(`${appt.date}T${appt.time}`);
          return apptDateTime >= now;
        });
        setAppointments(upcoming as Appointment[]);
      }
      setLoading(false);
    };

    fetchSession();
  }, []);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Trial Progress</Text>
        <Text style={styles.progressPercent}>{Math.floor(trialProgress)}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${trialProgress}%` }]} />
      </View>
      <Text style={styles.trialInfo}>{`ISA-RVD Trial • ${trialPhase}`}</Text>
    </View>
  );

  const renderAppointmentCard = (appointment: Appointment) => (
    <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentDateContainer}>
        <Text style={styles.appointmentDate}>{formatDate(appointment.date)}</Text>
        <Text style={styles.appointmentTime}>{formatTime(appointment.time)}</Text>
      </View>
      <View style={styles.appointmentDivider} />
      <View style={styles.appointmentDetails}>
        <Text style={styles.appointmentTitle}>{appointment.title}</Text>
        <Text style={styles.appointmentLocation}>{appointment.location}</Text>
        {appointment.requirements.map((req: string, index: number) => (
          <Text key={index} style={styles.appointmentRequirement}>
            • {req}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (loading)
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || "User"}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile")}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>{user?.name ? user?.name[0] : "U"}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {renderProgressBar()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Link href="../calendar" style={styles.seeAllText}>
              See All
            </Link>
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentsContainer}>
          {appointments.length > 0 ? appointments.slice(0, 3).map(renderAppointmentCard) : <Text>No upcoming appointments</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}