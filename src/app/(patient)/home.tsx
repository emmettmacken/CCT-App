import { Link, router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
import { useTabRefresh } from "../../hooks/useTabRefresh";

interface Appointment {
  id?: string;
  date?: string;
  time: string | null;
  title: string;
  location: string;
  requirements: string[];
}

interface AppointmentGroup {
  date: string;
  appointments: Appointment[];
}

interface PatientInfo {
  age: number;
  height: number;
  weight: number;
  trialId: string;
  consultant: string;
  trialStartDate: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Unavailable";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

const formatDate1 = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}
  -${year}`;
};

const formatTime = (timeStr: string | null) => {
  if (!timeStr) return "";
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialProgress, setTrialProgress] = useState(0);
  const [trialPhase, setTrialPhase] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  const fetchAppointments = useCallback(async (userId: string) => {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_grouped_appointments", {
      uid: userId,
    });

    if (!data || error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = (data as AppointmentGroup[])
        .map((group) => ({
          date: group.date,
          appointments: group.appointments || [],
        }))
        .filter((group) => {
          const apptDate = new Date(group.date);
          apptDate.setHours(0, 0, 0, 0);
          return apptDate >= today;
        });

      setAppointments(upcoming.slice(0, 3));
    }

    setLoading(false);
  }, []);

  // Move fetchSession outside useEffect
  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/(auth)/login");
      return;
    }

    const userId = data.session.user.id;

    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select(
        "id, name, age, height, weight, trial_id, consultant, trial_phase, trial_progress"
      )
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching profile:", userError);
      setUser({ name: data.session.user.email });
    } else {
      setUser(userData);
      setTrialPhase(userData?.trial_phase || null);
    }

    // Fetch patient trial (start_date + trial details)
    const { data: patientTrial, error: trialError } = await supabase
      .from("patient_trials")
      .select(
        `
        start_date,
        trial:trials(number_of_cycles, cycle_duration_days, name)
      `
      )
      .eq("patient_id", userId)
      .single();

    if (trialError) {
      console.error("Error fetching patient trial:", trialError);
    }

    const trialStartDate =
      patientTrial?.start_date || "Start date unavailable";

    setPatientInfo({
      age: userData?.age || 0,
      height: userData?.height || 0,
      weight: userData?.weight || 0,
      trialId: userData?.trial_id || "",
      consultant: userData?.consultant || "",
      trialStartDate,
    });

    // Calculate trial progress
    if (patientTrial?.trial && patientTrial.start_date) {
      const startDate = new Date(patientTrial.start_date);
      const trialDetails = Array.isArray(patientTrial.trial)
        ? patientTrial.trial[0]
        : patientTrial.trial;

      const numCycles = trialDetails?.number_of_cycles || 1;
      const cycleLength = trialDetails?.cycle_duration_days || 1;
      const today = new Date();

      const diffDays = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = numCycles * cycleLength;
      const progress = Math.min(Math.max((diffDays / totalDays) * 100, 0), 100);

      const currentCycle = Math.min(Math.floor(diffDays / cycleLength) + 1, numCycles);

      setTrialProgress(progress);

      if (Math.round(userData?.trial_progress ?? 0) !== Math.round(progress)) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ trial_progress: Math.round(progress) })
          .eq("id", userId);
        if (updateError) console.error("Error updating trial_progress:", updateError);
      }

      if (!userData?.trial_phase) {
        setTrialPhase(`Cycle ${currentCycle}`);
      }
    }

    fetchAppointments(userId);
  }, [fetchAppointments]);

  useTabRefresh(fetchSession);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Trial Progress</Text>
        <Text style={styles.progressPercent}>{Math.floor(trialProgress)}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${trialProgress}%` }]} />
      </View>
      <Text style={styles.trialInfo}>{trialPhase}</Text>
    </View>
  );

  const renderAppointmentCard = (group: AppointmentGroup) => {
    const titles = group.appointments.map((appt) => appt.title).join(", ");
    const requirements = group.appointments.flatMap(
      (appt) => appt.requirements || []
    );

    let times = "";
    const appointmentsWithTime = group.appointments.filter((appt) => appt.time);
    if (appointmentsWithTime.length === group.appointments.length && appointmentsWithTime.length > 0) {
      const earliestAppt = appointmentsWithTime.reduce((earliest, current) =>
        new Date(current.time!) < new Date(earliest.time!) ? current : earliest
      );
      times = formatTime(earliestAppt.time);
    } else {
      times = appointmentsWithTime.map((appt) => formatTime(appt.time)).join(", ");
    }

    return (
      <TouchableOpacity
        key={group.date}
        style={styles.appointmentCard}
        onPress={() =>
          router.push({
            pathname: "/calendar",
            params: { date: group.date },
          })
        }
      >
        <View style={styles.appointmentDateContainer}>
          <Text style={styles.appointmentDate}>{formatDate1(group.date)}</Text>
          {times !== "" && <Text style={styles.appointmentTime}>{times}</Text>}
        </View>
        <View style={styles.appointmentDivider} />
        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentTitle}>{titles}</Text>
          {group.appointments[0]?.location && (
            <Text style={styles.appointmentLocation}>
              {group.appointments[0].location}
            </Text>
          )}
          {requirements.map((req, index) => (
            <Text key={index} style={styles.appointmentRequirement}>
              • {req}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || "User"}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/profile")}
          >
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>
                {user?.name ? user?.name[0] : "U"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {patientInfo && (
          <View style={styles.patientCard}>
            <Text style={styles.patientCardTitle}>Patient Information</Text>
            <View style={styles.patientInfoRow}>
              <Text style={styles.infoText}>Age: {patientInfo.age}</Text>
              <Text style={styles.infoText}>Height: {patientInfo.height} cm</Text>
            </View>
            <View style={styles.patientInfoRow}>
              <Text style={styles.infoText}>Weight: {patientInfo.weight} kg</Text>
              <Text style={styles.infoText}>Trial ID: {patientInfo.trialId}</Text>
            </View>
            <View style={styles.patientInfoRow}>
              <Text style={styles.infoText}>Consultant: {patientInfo.consultant}</Text>
              <Text style={styles.infoText}>Trial Start: {formatDate(patientInfo.trialStartDate)}</Text>
            </View>
          </View>
        )}

        {trialPhase?.toLowerCase().includes("induction") && renderProgressBar()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Link href="../calendar" style={styles.seeAllText}>
              See All
            </Link>
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentsContainer}>
          {appointments.length > 0 ? (
            appointments.map(renderAppointmentCard)
          ) : (
            <Text>No upcoming appointments</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
