import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Button, Card, Chip, List, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { styles } from "../../styles/patients.styles";
import {
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

const addDays = (date: Date, days: number) => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

const PatientListScreen = ({ navigation }: { navigation: any }) => {
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<ListPatient[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [trialFilter, setTrialFilter] = useState<TrialFilter>("All");
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [trialFilters, setTrialFilters] = useState<string[]>(["All", "Unassigned"]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, role, trial_name, trial_phase, trial_progress, weight, height, age, trial_id")
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
    const fetchTrials = async () => {
      const { data, error } = await supabase
        .from("trials")
        .select("name");
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
        result = result.filter((p) => !p.trial_name || p.trial_name.trim() === "");
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
          {trialFilters.map((val) => (
            <Chip
              key={val}
              selected={trialFilter === val}
              onPress={() => setTrialFilter(val as TrialFilter)}
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
  const [activeTab, setActiveTab] = useState("appointments");
  const [loading, setLoading] = useState(true);

  // trial assignment UI
  const [trials, setTrials] = useState<any[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // edit medication modal
  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedFrequency, setEditMedFrequency] = useState("");
  const [editMedNotes, setEditMedNotes] = useState("");

  // use a reusable fetch so we can call after assignment
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;

      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", patientId)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });

      const { data: medicationsData } = await supabase
        .from("trial_medications")
        .select("*")
        .eq("user_id", patientId)
        .order("name", { ascending: true });

      setPatient(patientData);
      setAppointments(appointmentsData || []);
      setMedications(medicationsData || []);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    const fetchTrials = async () => {
      const { data, error } = await supabase
        .from("trials")
        .select("id, name, trial_phase"); // keep DB column names
      if (error) {
        console.error("Error fetching trials:", error);
      } else {
        setTrials(data || []);
      }
    };
    fetchTrials();
  }, []);

  const handleAssignTrial = async () => {
    if (!selectedTrial || !patient) return;

    Alert.alert(
      "Confirm Assignment",
      `Are you sure you want to assign ${patient.name} to this trial?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert("Not logged in", "You must be logged in to assign.");
                return;
              }

              // 0) Prevent duplicate assignment (optional but helpful)
              const { data: existing } = await supabase
                .from("patient_trials")
                .select("id")
                .eq("patient_id", patient.id)
                .eq("trial_id", selectedTrial)
                .limit(1);

              if (existing && existing.length > 0) {
                Alert.alert("Already assigned", "This patient is already assigned to that trial.");
                setShowAssignModal(false);
                setSelectedTrial(null);
                return;
              }

              // 1) Insert into patient_trials and return the row (we need id and start_date)
              const {
                data: patientTrialRow,
                error: patientTrialError,
              } = await supabase
                .from("patient_trials")
                .insert([
                  {
                    patient_id: patient.id,
                    trial_id: selectedTrial,
                    assigned_by: user.id,
                    status: "assigned",
                  },
                ])
                .select("*")
                .single();

              if (patientTrialError) {
                console.error("Error inserting patient_trial:", patientTrialError);
                Alert.alert("Error", "Could not assign trial (patient_trials insert).");
                return;
              }

              const patientTrialId = patientTrialRow.id;
              const startDateStr = patientTrialRow.start_date || new Date().toISOString().split("T")[0];
              const startDate = new Date(startDateStr);

              // 2) Fetch trial assessments and create appointments
              const { data: assessments, error: assessmentsError } = await supabase
                .from("trial_assessments")
                .select("*")
                .eq("trial_id", selectedTrial);

              if (assessmentsError) {
                console.error("Error fetching trial_assessments:", assessmentsError);
                Alert.alert("Warning", "Assigned trial but could not fetch assessments.");
              } else if (assessments && assessments.length > 0) {
                const appointmentsToInsert: any[] = [];

                assessments.forEach((a: any) => {
                  const scheduled_days = a.scheduled_days || [];
                  const daysArray = Array.isArray(scheduled_days)
                    ? scheduled_days
                    : [scheduled_days];

                  daysArray.forEach((rawDay: any) => {
                    const dayNum = Number(rawDay);
                    if (Number.isNaN(dayNum)) return;
                    const apptDate = addDays(startDate, dayNum - 1);
                    appointmentsToInsert.push({
                      user_id: patient.id,
                      date: apptDate.toISOString().split("T")[0],
                      time: null,
                      title: a.name,
                      category: a.category || "Clinic",
                      requirements: a.requirements ? [a.requirements] : null,
                      patient_trial_id: patientTrialId,
                    });
                  });
                });

                if (appointmentsToInsert.length > 0) {
                  const { error: insertAppointmentsError } = await supabase
                    .from("appointments")
                    .insert(appointmentsToInsert);

                  if (insertAppointmentsError) {
                    console.error("Error inserting appointments:", insertAppointmentsError);
                    Alert.alert("Warning", "Assigned trial but could not create appointments.");
                  } else {
                    console.log("Inserted appointments:", appointmentsToInsert.length);
                  }
                } else {
                  console.log("No appointment rows to insert (no scheduled_days found).");
                }
              }

              // 3) Fetch trial medication templates and insert into trial_medications
              const { data: medsTemplate, error: medsTemplateError } = await supabase
                .from("trial_medications_template")
                .select("*")
                .eq("trial_id", selectedTrial);

              if (medsTemplateError) {
                console.error("Error fetching meds template:", medsTemplateError);
                Alert.alert("Warning", "Assigned trial but could not fetch medication templates.");
              } else if (medsTemplate && medsTemplate.length > 0) {
                const medsToInsert = medsTemplate.map((m: any) => ({
                  user_id: patient.id,
                  name: m.drug_name,
                  dosage: m.dosage,
                  frequency: m.frequency,
                  created_at: new Date().toISOString(),
                  notes: JSON.stringify({
                    applicable_cycles: m.applicable_cycles ?? null,
                    special_conditions: m.special_conditions ?? null,
                    administration_pattern: m.administration_pattern ?? null,
                  }),
                  patient_trial_id: patientTrialId,
                }));

                if (medsToInsert.length > 0) {
                  const { error: insertMedsError } = await supabase
                    .from("trial_medications")
                    .insert(medsToInsert);

                  if (insertMedsError) {
                    console.error("Error inserting trial_medications:", insertMedsError);
                    Alert.alert("Warning", "Assigned trial but could not create medications.");
                  } else {
                    console.log("Inserted medications:", medsToInsert.length);
                  }
                }
              }

              // 4) Also update profile for easy filtering
              const trialMeta = trials.find((t) => t.id === selectedTrial);
              const { error: updateProfileError } = await supabase
                .from("profiles")
                .update({
                  trial_name: trialMeta?.name || null,
                  trial_phase: trialMeta?.trial_phase || "Induction",
                })
                .eq("id", patient.id);

              if (updateProfileError) {
                console.error("Error updating profile fields:", updateProfileError);
              }

              // 5) close modal, clear selection and refresh patient data
              setShowAssignModal(false);
              setSelectedTrial(null);

              await fetchPatientData();

              Alert.alert("Success", "Trial assigned and items copied.");
            } catch (error) {
              console.error("Error assigning trial:", error);
              Alert.alert("Error", "An unexpected error occurred while assigning the trial.");
            }
          },
        },
      ]
    );
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setEditMedName(med.name);
    setEditMedDosage(med.dosage ?? "");
    setEditMedFrequency(med.frequency ?? "");
    setEditMedNotes(med.notes ?? "");
    setShowEditMedModal(true);
  };

  const submitEditMedication = async () => {
    if (!editingMedication) return;

    const { error } = await supabase
      .from("trial_medications")
      .update({
        name: editMedName,
        dosage: editMedDosage,
        frequency: editMedFrequency,
        notes: editMedNotes,
      })
      .eq("id", editingMedication.id);

    if (error) {
      Alert.alert("Error", "Failed to update medication.");
      console.error(error);
    } else {
      Alert.alert("Success", "Medication updated.");
      setShowEditMedModal(false);
      setEditingMedication(null);
      await fetchPatientData();
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
            {patient.trial_name ?? "Unassigned"} | {patient.age} years | {patient.weight} kg | {patient.height} cm | Trial ID: {patient.trial_id ?? "-"}
          </Text>
        </View>

        {!patient.trial_name && (
          <Button
            mode="contained"
            onPress={() => setShowAssignModal(true)}
            style={{ margin: 10 }}
          >
            Assign Trial
          </Button>
        )}

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
                      description={`${appt.title} - ${appt.category} - ${appt.location}`}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No appointments found</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {activeTab === "medications" && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {medications.length > 0 ? (
                <List.Section>
                  {medications.map((med) => (
                    <List.Item
                      key={med.id}
                      title={med.name}
                      description={`${med.dosage ?? ""} - ${med.frequency ?? ""}`}
                      left={() => <List.Icon icon="pill" />}
                      right={() => (
                        <TouchableOpacity onPress={() => handleEditMedication(med)}>
                          <List.Icon icon="pencil" />
                        </TouchableOpacity>
                      )}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No medications found</Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Assign Trial Modal */}
      <Modal
        visible={showAssignModal}
        onRequestClose={() => setShowAssignModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Trial</Text>

            {trials.map((trial) => (
              <TouchableOpacity
                key={trial.id}
                style={[
                  styles.trialOption,
                  selectedTrial === trial.id && styles.activeTrialOption,
                ]}
                onPress={() => setSelectedTrial(trial.id)}
              >
                <Text>
                  {trial.name} (Phase {trial.trial_phase ?? trial.phase ?? "-"})
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowAssignModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAssignTrial}
                disabled={!selectedTrial}
                style={styles.submitButton}
              >
                Confirm
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Medication Modal */}
      <Modal
        visible={showEditMedModal}
        onRequestClose={() => setShowEditMedModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Medication</Text>

            <TextInput
              label="Name"
              value={editMedName}
              onChangeText={setEditMedName}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Dosage"
              value={editMedDosage}
              onChangeText={setEditMedDosage}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Frequency"
              value={editMedFrequency}
              onChangeText={setEditMedFrequency}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Notes"
              value={editMedNotes}
              onChangeText={setEditMedNotes}
              mode="outlined"
              multiline
              style={{ marginBottom: 10 }}
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowEditMedModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={submitEditMedication}
                style={styles.submitButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export { PatientListScreen as default, PatientProfileScreen };