import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, Card, Chip, List, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/patients.styles";
import {
  Alert,
  Appointment,
  ClinicianNote,
  Medication,
  Patient,
} from "../../types/patients";

type ListPatient = {
  id: string;
  name: string | null;
  trial_name: string | null;
  trial_phase: string | null;
  trial_progress: number | null;
};

const TRIAL_FILTERS = ["All", "ISA", "ASCENT", "Unassigned"] as const;
type TrialFilter = (typeof TRIAL_FILTERS)[number];

const getAppointmentDateTime = (appt: any) => {
  if (appt.time) {
    return parseISO(`${appt.date}T${appt.time}`);
  }
  return parseISO(appt.date);
};
const PatientListScreen = ({ navigation }: { navigation: any }) => {
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<ListPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [trialFilter, setTrialFilter] = useState<TrialFilter>("All");
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Pull directly from public.profiles using existing columns
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, role, trial_name, trial_phase, trial_progress")
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

    fetchPatients();

    // Listen for changes to profiles (e.g., trial assignment updates)
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

  useEffect(() => {
    let result = [...patients];

    // Search by name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => (p.name ?? "").toLowerCase().includes(q));
    }

    // Filter by trial assignment
    if (trialFilter !== "All") {
      if (trialFilter === "Unassigned") {
        result = result.filter(
          (p) => !p.trial_name || p.trial_name.trim() === ""
        );
      } else {
        result = result.filter(
          (p) =>
            (p.trial_name ?? "").toLowerCase() === trialFilter.toLowerCase()
        );
      }
    }

    setFilteredPatients(result);
  }, [searchQuery, trialFilter, patients]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading patients...</Text>
      </SafeAreaView>
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
          {TRIAL_FILTERS.map((val) => (
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
                }  ·  Phase: ${patient.trial_phase ?? "-"}  ·  Progress: ${
                  patient.trial_progress ?? 0
                }%`}
                left={() => (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(patient.name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                // Removed last_appointment + alerts UI since those fields aren't in profiles schema
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
      {/* Patient Profile Modal */}
      <Modal
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
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

const PatientProfileScreen = ({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState<ClinicianNote[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState("appointments");
  const [loading, setLoading] = useState(true);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [editMedData, setEditMedData] = useState<Partial<Medication>>({});
  const [showMedModal, setShowMedModal] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", patientId)
          .single();

        if (patientError) throw patientError;

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } =
          await supabase
            .from("appointments")
            .select("*")
            .eq("user_id", patientId)
            .gte('date', new Date().toISOString().split('T')[0]) // only shows today or future appointments
            .order("date", { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Fetch medications
        const { data: medicationsData, error: medicationsError } =
          await supabase
            .from("trial_medications")
            .select("*")
            .eq("user_id", patientId)
            .order("name", { ascending: true });

        if (medicationsError) throw medicationsError;

        /* Fetch clinician notes
        const { data: notesData, error: notesError } = await supabase
          .from("clinician_notes")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;

        // Fetch alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from("patient_alerts")
          .select("*")
          .eq("patient_id", patientId)
          .eq("active", true);

        if (alertsError) throw alertsError; */

        setPatient(patientData);
        setAppointments(appointmentsData || []);
        setMedications(medicationsData || []);
        /*setNotes(notesData || []);
        setAlerts(alertsData || []);*/
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();

    const subscription = supabase
      .channel("patient-profile")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => fetchPatientData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medications" },
        () => fetchPatientData()
      )
      /*.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clinician_notes" },
        () => fetchPatientData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient_alerts" },
        () => fetchPatientData()
      )*/
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [patientId]);

  const handleUpdateMedication = async () => {
    if (!editMedId) return;

    try {
      await supabase
        .from("trial_medications")
        .update(editMedData)
        .eq("id", editMedId);

      setShowMedModal(false);
      setEditMedId(null);
    } catch (error) {
      console.error("Error updating medication:", error);
    }
  };

  if (loading || !patient) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading patient data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.profileContainer}>
        {/* Patient Header */}
        <View style={styles.profileHeader}>
          <Button mode="text" onPress={onClose}>
            Close
          </Button>

          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {patient.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{patient.name}</Text>
          <Text style={styles.profileDetails}>
            {patient.age} years | {patient.trial_name}
          </Text>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card style={styles.alertCard}>
            <Card.Title title="Alerts" titleStyle={styles.cardTitle} />
            <Card.Content>
              {alerts.map((alert) => (
                <View key={alert.id} style={styles.alertItem}>
                  <View
                    style={[
                      styles.alertIcon,
                      alert.type === "fasting" && styles.fastingAlert,
                      alert.type === "allergy" && styles.allergyAlert,
                      alert.type === "precaution" && styles.precautionAlert,
                    ]}
                  >
                    <Text style={styles.alertIconText}>
                      {alert.type === "fasting"
                        ? "F"
                        : alert.type === "allergy"
                        ? "A"
                        : "P"}
                    </Text>
                  </View>
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "appointments" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("appointments")}
          >
            <Text style={styles.tabText}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "medications" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("medications")}
          >
            <Text style={styles.tabText}>Medications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "notes" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("notes")}
          >
            <Text style={styles.tabText}>Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {appointments.length > 0 ? (
                <List.Section>
                  {appointments.map((appt) => (
                    <List.Item
                      key={appt.id}
                      title={format(
                        getAppointmentDateTime(appt),
                        appt.time ? "PPPPp" : "PPPP"
                      )}
                      description={`${appt.title} - ${appt.location}`}
                      left={() => (
                        <View
                          style={[
                            styles.statusIndicator,
                            appt.status === "completed" &&
                              styles.completedStatus,
                            appt.status === "upcoming" && styles.upcomingStatus,
                          ]}
                        />
                      )}
                      right={() =>
                        appt.notes && (
                          <List.Icon icon="note-text" color="#666" />
                        )
                      }
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No appointments found</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Medications Tab */}
        {activeTab === "medications" && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {medications.length > 0 ? (
                <List.Section>
                  {medications.map((med) => (
                    <List.Item
                      key={med.id}
                      title={med.name}
                      description={`${med.dosage} - ${med.frequency}`}
                      left={() => <List.Icon icon="pill" />}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={() => {
                            setEditMedId(med.id);
                            setEditMedData({
                              dosage: med.dosage,
                              frequency: med.frequency,
                              notes: med.notes,
                            });
                            setShowMedModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No medications found</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {notes.length > 0 ? (
                <List.Section>
                  {notes.map((note) => (
                    <List.Item
                      key={note.id}
                      title={note.author}
                      description={`${format(
                        parseISO(note.created_at),
                        "PP"
                      )}\n${note.content}`}
                      left={() => <List.Icon icon="note" />}
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No notes found</Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Medication Edit Modal */}
      <Modal
        visible={showMedModal}
        onRequestClose={() => setShowMedModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Medication</Text>

            <TextInput
              label="Dosage"
              value={editMedData.dosage || ""}
              onChangeText={(text) =>
                setEditMedData({ ...editMedData, dosage: text })
              }
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Frequency"
              value={editMedData.frequency || ""}
              onChangeText={(text) =>
                setEditMedData({ ...editMedData, frequency: text })
              }
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Notes"
              value={editMedData.notes || ""}
              onChangeText={(text) =>
                setEditMedData({ ...editMedData, notes: text })
              }
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowMedModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdateMedication}
                style={styles.submitButton}
                disabled={!editMedData.dosage || !editMedData.frequency}
              >
                Save Changes
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export { PatientListScreen as default, PatientProfileScreen };
