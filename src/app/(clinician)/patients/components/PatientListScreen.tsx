import { useTabRefresh } from "@/src/hooks/useTabRefresh";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Chip, List, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../../backend/supabaseClient";
import { styles } from "@/src/styles/patients.styles";

import PatientProfileScreen from "./PatientProfileScreen";

export type ListPatient = {
  id: string;
  name: string | null;
  trial_name: string | null;
  trial_phase: string | null;
  trial_progress: number | null;
};

interface PatientListScreenProps {
  navigation: any;
}

const PatientListScreen: React.FC<PatientListScreenProps> = ({ navigation }) => {
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<ListPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [trialFilter, setTrialFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [trialFilters, setTrialFilters] = useState<string[]>([
    "All",
    "Unassigned",
  ]);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, role, trial_name, trial_phase, trial_progress, weight, height, age, trial_id"
        )
        .eq("role", "patient");

      if (error) throw error;

      const formatted: ListPatient[] = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        trial_name: item.trial_name,
        trial_phase: item.trial_phase,
        trial_progress: item.trial_progress,
      }));

      setPatients(formatted);
      setFilteredPatients(formatted);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const subscription = supabase
      .channel("profiles-patient-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useTabRefresh(fetchPatients);

  useEffect(() => {
    const fetchTrials = async () => {
      const { data, error } = await supabase.from("trials").select("name");
      if (error) {
        console.error("Error fetching trials:", error);
      } else {
        const trialNames = (data ?? []).map((t) => t.name);
        setTrialFilters(["All", ...trialNames, "Unassigned"]);
      }
    };
    fetchTrials();
  }, []);

  useEffect(() => {
    let result = [...patients];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => (p.name ?? "").toLowerCase().includes(q));
    }

    if (trialFilter !== "All") {
      if (trialFilter === "Unassigned") {
        result = result.filter(
          (p) => !p.trial_name || p.trial_name.trim() === ""
        );
      } else {
        result = result.filter(
          (p) => (p.trial_name ?? "").toLowerCase() === trialFilter.toLowerCase()
        );
      }
    }

    setFilteredPatients(result);
  }, [searchQuery, trialFilter, patients]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading patient information...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.filterContainer}>
        <TextInput
          label="Search patients"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
        />

        <View style={styles.chipContainer}>
          {trialFilters.map((val) => (
            <Chip
              key={val}
              selected={trialFilter === val}
              onPress={() => setTrialFilter(val)}
              style={styles.chip}
            >
              {val}
            </Chip>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredPatients.length > 0 ? (
          <List.Section>
            {filteredPatients.map((patient) => (
              <List.Item
                key={patient.id}
                title={patient.name ?? "Unnamed"}
                description={`Trial: ${
                  patient.trial_name ?? "Unassigned"
                }  ·  Phase: ${patient.trial_phase ?? "-"}${
                  patient.trial_phase === "Induction"
                    ? `  ·  Progress: ${patient.trial_progress ?? 0}%`
                    : ""
                }`}
                left={() => (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(patient.name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                style={styles.listItem}
                onPress={() => {
                  setSelectedPatientId(patient.id);
                  setShowProfileModal(true);
                }}
              />
            ))}
          </List.Section>
        ) : (
          <Text style={styles.noPatientsText}>No patients found</Text>
        )}
      </ScrollView>
      <Modal
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "left", "right"]}>
          {selectedPatientId && (
            <PatientProfileScreen
              patientId={selectedPatientId}
              onClose={() => setShowProfileModal(false)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default PatientListScreen;
