import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, Chip, List, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import OptionalMedicationAssigner from "../../components/OptionalMedicationAssigner";
import PatientMedicationLogBook from "../../components/PatientMedicationLogBook";
import PatientNotes from "../../components/PatientNotes";
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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
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
          (p) =>
            (p.trial_name ?? "").toLowerCase() === trialFilter.toLowerCase()
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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
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
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // trial assignment UI
  const [trials, setTrials] = useState<any[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // edit medication modal
  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );

  const [editMedName, setEditMedName] = useState("");
  const [editMedFrequency, setEditMedFrequency] = useState("");
  const [editMedNotes, setEditMedNotes] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");

  // edit appointment modal
  const [showEditApptModal, setShowEditApptModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [editApptDate, setEditApptDate] = useState("");
  const [editApptTime, setEditApptTime] = useState("");
  const [editApptTitle, setEditApptTitle] = useState("");
  const [editApptCategory, setEditApptCategory] = useState("");
  const [editApptLocation, setEditApptLocation] = useState("");
  const [editApptRequirements, setEditApptRequirements] = useState("");

  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const [offsetDays, setOffsetDays] = useState(""); // user input for days
  const [appointmentsToOffset, setAppointmentsToOffset] = useState<
    Appointment[]
  >([]);

  // Mass Edit Medication modal states
  const [showMassEditMedModal, setShowMassEditMedModal] = useState(false);
  const [uniqueMeds, setUniqueMeds] = useState<Medication[]>([]);
  const [selectedMassMedId, setSelectedMassMedId] = useState<string | null>(
    null
  );
  const [selectedField, setSelectedField] = useState<
    "name" | "frequency" | "notes"
  >("name");
  const [currentFieldValue, setCurrentFieldValue] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Mass Edit Appointments state
  const [showMassEditApptModal, setShowMassEditApptModal] = useState(false);
  const [selectedMassApptId, setSelectedMassApptId] = useState<string | null>(
    null
  );
  const [selectedApptField, setSelectedApptField] = useState("");
  const [currentApptFieldValue, setCurrentApptFieldValue] = useState("");
  const [newApptFieldValue, setNewApptFieldValue] = useState("");
  const [uniqueAppointments, setUniqueAppointments] = useState<any[]>([]);

  const [startDateInput, setStartDateInput] = useState("");

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
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true });

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

  useEffect(() => {
    const uniq = Array.from(
      new Map(medications.map((m) => [m.name, m])).values()
    );
    setUniqueMeds(uniq);
  }, [medications]);

  useEffect(() => {
    const uniq = Array.from(
      new Map(appointments.map((a) => [a.title, a])).values()
    );
    setUniqueAppointments(uniq);
  }, [appointments]);

  const deleteEditMedication = async () => {
    if (!editingMedication) return;

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this medication?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // delete from Supabase
            const { error } = await supabase
              .from("trial_medications")
              .delete()
              .eq("id", editingMedication.id);

            if (error) {
              alert("Failed to delete medication: " + error.message);
            } else {
              alert("Medication deleted successfully!");
              setShowEditMedModal(false);
              setEditingMedication(null);
              await fetchPatientData();
            }
          },
        },
      ]
    );
  };

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
                Alert.alert(
                  "Not logged in",
                  "You must be logged in to assign."
                );
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
                Alert.alert(
                  "Already assigned",
                  "This patient is already assigned to that trial."
                );
                setShowAssignModal(false);
                setSelectedTrial(null);
                return;
              }

              // 1a) Determine start date (use input if provided, else null = Supabase default)
              const startDateToInsert =
                startDateInput && startDateInput.trim() !== ""
                  ? startDateInput.trim()
                  : null;

              // 1b) Insert into patient_trials and return the row (we need id and start_date)
              const { data: patientTrialRow, error: patientTrialError } =
                await supabase
                  .from("patient_trials")
                  .insert([
                    {
                      patient_id: patient.id,
                      trial_id: selectedTrial,
                      assigned_by: user.id,
                      status: "assigned",
                      ...(startDateToInsert && {
                        start_date: startDateToInsert,
                      }),
                    },
                  ])
                  .select("*")
                  .single();

              if (patientTrialError) {
                console.error(
                  "Error inserting patient_trial:",
                  patientTrialError
                );
                Alert.alert(
                  "Error",
                  "Could not assign trial (patient_trials insert)."
                );
                return;
              }

              const patientTrialId = patientTrialRow.id;
              const startDateStr =
                patientTrialRow.start_date ||
                new Date().toISOString().split("T")[0];
              const startDate = new Date(startDateStr);

              // 2) Fetch trial assessments and create appointments
              const { data: assessments, error: assessmentsError } =
                await supabase
                  .from("trial_assessments")
                  .select("*")
                  .eq("trial_id", selectedTrial);

              if (assessmentsError) {
                console.error(
                  "Error fetching trial_assessments:",
                  assessmentsError
                );
                Alert.alert(
                  "Warning",
                  "Assigned trial but could not fetch assessments."
                );
              } else if (assessments && assessments.length > 0) {
                const appointmentsToInsert = [];

                // Fetch trial details (number_of_cycles + cycle_duration_days)
                const { data: trialData, error: trialError } = await supabase
                  .from("trials")
                  .select("number_of_cycles, cycle_duration_days")
                  .eq("id", selectedTrial)
                  .single();

                if (trialError || !trialData) {
                  console.error("Error fetching trial info:", trialError);
                } else {
                  const { number_of_cycles, cycle_duration_days } = trialData;

                  assessments.forEach((a) => {
                    const applicableCycles =
                      Array.isArray(a.applicable_cycles) &&
                      a.applicable_cycles.length > 0
                        ? a.applicable_cycles.map(Number)
                        : Array.from(
                            { length: number_of_cycles },
                            (_, i) => i + 1
                          );

                    const scheduledDays = Array.isArray(a.scheduled_days)
                      ? a.scheduled_days.map(Number)
                      : [];

                    applicableCycles.forEach((cycle) => {
                      scheduledDays.forEach((dayNum) => {
                        if (Number.isNaN(dayNum) || Number.isNaN(cycle)) return;

                        const offset =
                          (cycle - 1) * cycle_duration_days + (dayNum - 1);
                        const apptDate = addDays(startDate, offset);

                        appointmentsToInsert.push({
                          user_id: patient.id,
                          date: apptDate.toISOString().split("T")[0],
                          time: null,
                          title: a.name,
                          category: a.category || "Clinic",
                          requirements: a.requirements
                            ? [a.requirements]
                            : null,
                          patient_trial_id: patientTrialId,
                        });
                      });
                    });
                  });
                }

                if (appointmentsToInsert.length > 0) {
                  const { error: insertAppointmentsError } = await supabase
                    .from("appointments")
                    .insert(appointmentsToInsert);

                  if (insertAppointmentsError) {
                    console.error(
                      "Error inserting appointments:",
                      insertAppointmentsError
                    );
                    Alert.alert(
                      "Warning",
                      "Assigned trial but could not create appointments."
                    );
                  }
                } else {
                  console.log(
                    "No appointment rows to insert (no scheduled_days found)."
                  );
                }
              }

              // 3) Fetch trial medication templates and insert into trial_medications
              try {
                const { data: trialRow, error: trialError } = await supabase
                  .from("trials")
                  .select("id, cycle_duration_days")
                  .eq("id", selectedTrial)
                  .single();

                if (trialError || !trialRow) {
                  console.error("Error fetching trial row:", trialError);
                  Alert.alert(
                    "Error",
                    "Could not fetch trial data for cycle duration."
                  );
                  return;
                }

                const cycleDurationDays = trialRow.cycle_duration_days;

                const { data: medsTemplate, error: medsTemplateError } =
                  await supabase
                    .from("trial_medications_template")
                    .select("*")
                    .eq("trial_id", selectedTrial);

                if (medsTemplateError) {
                  console.error(
                    "Error fetching meds template:",
                    medsTemplateError
                  );
                  Alert.alert(
                    "Warning",
                    "Assigned trial but could not fetch medication templates."
                  );
                  return;
                }

                if (!medsTemplate || medsTemplate.length === 0) {
                  console.log("No medication templates found for this trial.");
                  return;
                }

                const medsToInsert = [];

                medsTemplate.forEach((m) => {
                  const rawApplicableCycles = Array.isArray(m.applicable_cycles)
                    ? m.applicable_cycles
                    : [];
                  const rawScheduledDays = Array.isArray(m.scheduled_days)
                    ? m.scheduled_days
                    : [];

                  const uniqueCycles = [...new Set(rawApplicableCycles)];
                  const uniqueDays = [...new Set(rawScheduledDays)];

                  uniqueCycles.forEach((cycle) => {
                    uniqueDays.forEach((dayNum) => {
                      const cycleOffset = (cycle - 1) * cycleDurationDays;
                      const dayOffset = dayNum - 1;
                      const totalOffset = cycleOffset + dayOffset;
                      const medDate = addDays(startDate, totalOffset);

                      medsToInsert.push({
                        user_id: patient.id,
                        name: m.drug_name,
                        frequency: m.frequency,
                        scheduled_date: medDate.toISOString().split("T")[0],
                        created_at: new Date().toISOString(),
                        notes: m.special_conditions || "No ",
                        patient_trial_id: patientTrialId,
                      });
                    });
                  });
                });

                if (medsToInsert.length > 0) {
                  const { error: insertMedsError } = await supabase
                    .from("trial_medications")
                    .insert(medsToInsert);

                  if (insertMedsError) {
                    console.error(
                      "Error inserting trial_medications:",
                      insertMedsError
                    );
                    Alert.alert(
                      "Warning",
                      "Assigned trial but could not create medications."
                    );
                  }
                } else {
                  console.log("No medication rows to insert.");
                }
              } catch (err) {
                console.error("Unexpected error in Step 3:", err);
                Alert.alert(
                  "Error",
                  "An unexpected error occurred while creating medications."
                );
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
                console.error(
                  "Error updating profile fields:",
                  updateProfileError
                );
              }

              // 5) close modal, clear selection and refresh patient data
              setShowAssignModal(false);
              setSelectedTrial(null);
              setStartDateInput("");

              await fetchPatientData();

              Alert.alert(
                "Success",
                `Trial assigned starting on ${startDateStr}.`
              );
            } catch (error) {
              console.error("Error assigning trial:", error);
              Alert.alert(
                "Error",
                "An unexpected error occurred while assigning the trial."
              );
            }
          },
        },
      ]
    );
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setEditMedName(med.name);
    setEditMedFrequency(med.frequency ?? "");
    setEditMedNotes(med.notes ?? "");
    setEditScheduledDate(med.scheduled_date ?? "");
    setShowEditMedModal(true);
  };

  const submitEditMedication = async () => {
    if (!editingMedication) return;

    const { error } = await supabase
      .from("trial_medications")
      .update({
        name: editMedName,
        frequency: editMedFrequency,
        notes: editMedNotes,
        scheduled_date: editScheduledDate,
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

  const handleEditAppointment = (appt: Appointment) => {
    setEditingAppointment(appt);
    setEditApptDate(appt.date ?? "");
    setEditApptTime(appt.time ?? "");
    setEditApptTitle(appt.title ?? "");
    setEditApptCategory(appt.category ?? "");
    setEditApptLocation(appt.location ?? "");
    // requirements may be array or string; normalize to comma-separated string
    const reqs = Array.isArray(appt.requirements)
      ? appt.requirements.join(", ")
      : appt.requirements ?? "";
    setEditApptRequirements(reqs);
    setShowEditApptModal(true);
  };

  // Helper to parse YYYY-MM-DD as UTC date (no timezone shift)
  const parseDateUTC = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const handleOffsetAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureAppointments = appointments.filter((appt) => {
      const apptDate = parseDateUTC(appt.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate >= today;
    });

    if (futureAppointments.length === 0) {
      Alert.alert(
        "No future appointments",
        "There are no appointments to offset."
      );
      return;
    }

    setAppointmentsToOffset(futureAppointments);
    setOffsetDays("");
    setProgress({ current: 0, total: futureAppointments.length });
    setShowOffsetModal(true);
  };

  const confirmOffsetAppointments = () => {
    const days = parseInt(offsetDays, 10);
    if (isNaN(days)) {
      Alert.alert("Invalid Input", "Please enter a valid number of days.");
      return;
    }

    Alert.alert(
      "Confirm Offset",
      `Are you sure you want to offset all appointments by ${days} days?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              const total = appointmentsToOffset.length;
              for (let i = 0; i < total; i++) {
                const appt = appointmentsToOffset[i];

                // Calculate new date
                const oldDate = parseDateUTC(appt.date);
                const newDate = new Date(oldDate);
                newDate.setUTCDate(newDate.getUTCDate() + days);
                const newDateStr = newDate.toISOString().split("T")[0];

                // Update local state
                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === appt.id ? { ...a, date: newDateStr } : a
                  )
                );

                // Update Supabase
                await supabase
                  .from("appointments")
                  .update({ date: newDateStr })
                  .eq("id", appt.id);

                // Update progress
                setProgress({ current: i + 1, total });
              }

              setShowOffsetModal(false);
              setOffsetDays("");
              Alert.alert(
                "Success",
                `${total} appointments moved by ${days} days.`
              );
            } catch (error) {
              console.error("Error offsetting appointments:", error);
              Alert.alert(
                "Error",
                "Something went wrong while updating appointments."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const submitEditAppointment = async () => {
    // Normalize requirements into array if non-empty
    const reqArray =
      editApptRequirements && editApptRequirements.trim() !== ""
        ? editApptRequirements.split(",").map((r) => r.trim())
        : null;

    // Do not proceed if patient is null
    if (!patient) {
      Alert.alert("Error", "Patient data is not loaded.");
      return;
    }

    // Prepare the appointment payload
    const appointmentData = {
      user_id: patient.id,
      date: editApptDate,
      time: editApptTime === "" ? null : editApptTime,
      title: editApptTitle,
      category: editApptCategory,
      location: editApptLocation,
      requirements: reqArray,
    };

    if (editingAppointment) {
      // Edit existing appointment
      const { error } = await supabase
        .from("appointments")
        .update(appointmentData)
        .eq("id", editingAppointment.id);

      if (error) {
        Alert.alert("Error", "Failed to update appointment.");
        console.error(error);
        return;
      }

      Alert.alert("Success", "Appointment updated.");
    } else {
      // Add new appointment
      const { error } = await supabase
        .from("appointments")
        .insert(appointmentData);

      if (error) {
        Alert.alert("Error", "Failed to add appointment.");
        console.error(error);
        return;
      }

      Alert.alert("Success", "Appointment added.");
    }

    // Close modal and refresh data
    setShowEditApptModal(false);
    setEditingAppointment(null);
    await fetchPatientData();
  };

  const deleteEditAppointment = async () => {
    if (!editingAppointment) return;

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("appointments")
              .delete()
              .eq("id", editingAppointment.id);

            if (error) {
              alert("Failed to delete appointment: " + error.message);
            } else {
              alert("Appointment deleted successfully!");
              setShowEditApptModal(false);
              setEditingAppointment(null);
              await fetchPatientData();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Updating patient data...</Text>
      </View>
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
            {patient.trial_name ?? "Unassigned"} | {patient.age} years |{" "}
            {patient.weight} kg | {patient.height} cm | Trial ID:{" "}
            {patient.trial_id ?? "-"}
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
              {/* Add Appointment Button */}
              {appointments.length > 0 && (
                <Button
                  mode="contained"
                  style={[styles.addAppointment, { marginBottom: 10 }]}
                  onPress={() => {
                    // Reset all form fields
                    setEditingAppointment(null);
                    setEditApptTitle("");
                    setEditApptCategory("");
                    setEditApptLocation("");
                    setEditApptDate("");
                    setEditApptTime("");
                    setEditApptRequirements("");

                    // Open modal
                    setShowEditApptModal(true);
                  }}
                >
                  Add Appointment
                </Button>
              )}
              {/* Offset All Appointments Button */}
              {appointments.length > 0 && (
                <Button
                  mode="contained"
                  style={styles.offsetAppointment}
                  onPress={() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Filter appointments for today or later
                    const futureAppts = appointments.filter((appt) => {
                      const apptDate = getAppointmentDateTime(appt);
                      apptDate.setHours(0, 0, 0, 0);
                      return apptDate >= today;
                    });

                    setAppointmentsToOffset(futureAppts);
                    setOffsetDays(""); // reset input
                    setShowOffsetModal(true);
                  }}
                >
                  Offset All Appointments
                </Button>
              )}
              {appointments.length > 0 && (
                <Button
                  mode="contained"
                  onPress={() => setShowMassEditApptModal(true)}
                  style={{ marginBottom: 10 }}
                >
                  Mass Edit Appointments
                </Button>
              )}
              {appointments.length > 0 ? (
                <List.Section>
                  {Object.entries(
                    appointments.reduce((groups, appt) => {
                      const dateKey = format(
                        getAppointmentDateTime(appt),
                        "PPPP"
                      );
                      if (!groups[dateKey]) groups[dateKey] = [];
                      groups[dateKey].push(appt);
                      return groups;
                    }, {} as Record<string, Appointment[]>)
                  ).map(([date, appts]) => (
                    <View key={date} style={{ marginBottom: 15 }}>
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          marginBottom: 5,
                        }}
                      >
                        {date}
                      </Text>

                      {appts.map((appt) => (
                        <List.Item
                          key={appt.id}
                          title={
                            appt.time
                              ? format(getAppointmentDateTime(appt), "p")
                              : appt.title
                          }
                          description={`${appt.title} - ${appt.category} - ${appt.location}`}
                          right={() => (
                            <TouchableOpacity
                              onPress={() => handleEditAppointment(appt)}
                            >
                              <List.Icon icon="pencil" />
                            </TouchableOpacity>
                          )}
                        />
                      ))}
                    </View>
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
              {medications.length > 0 && (
                <PatientMedicationLogBook patientId={patientId} />
              )}
              {medications.length > 0 && (
                <OptionalMedicationAssigner patientId={patientId} />
              )}
              {medications.length > 0 && (
                <Button
                  mode="contained"
                  style={styles.massEditButton}
                  onPress={() => {
                    setShowMassEditMedModal(true);
                    setSelectedMassMedId(null);
                    setSelectedField("name");
                    setCurrentFieldValue("");
                    setNewFieldValue("");
                  }}
                >
                  Mass Edit Medications
                </Button>
              )}
              {medications.length > 0 ? (
                <List.Section>
                  {medications.map((med) => (
                    <List.Item
                      key={med.id}
                      title={med.name}
                      description={`${med.frequency ?? ""}${
                        med.scheduled_date
                          ? ` | Scheduled: ${formatDate(med.scheduled_date)}`
                          : ""
                      }${med.notes ? ` | Notes: ${med.notes}` : ""}`}
                      left={() => <List.Icon icon="pill" />}
                      right={() => (
                        <TouchableOpacity
                          onPress={() => handleEditMedication(med)}
                        >
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

        {activeTab === "notes" && <PatientNotes patientId={patientId} />}
      </ScrollView>

      {/* Offset Appointments Modal */}
      <Modal
        visible={showOffsetModal}
        onRequestClose={() => setShowOffsetModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Offset Appointments</Text>
            <Text>{`You have ${appointmentsToOffset.length} appointment(s) scheduled today or in the future.`}</Text>

            <TextInput
              label="Days to offset"
              value={offsetDays}
              onChangeText={setOffsetDays}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginVertical: 10 }}
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowOffsetModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmOffsetAppointments}
                disabled={!offsetDays || isNaN(parseInt(offsetDays)) || loading}
                style={styles.submitButton}
              >
                Confirm
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Mass edit appointments modal */}
      <Modal
        visible={showMassEditApptModal}
        onRequestClose={() => setShowMassEditApptModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Mass Edit Appointments</Text>

            <View style={[styles.buttonRow, { marginBottom: 10 }]}>
              <Button
                mode="outlined"
                onPress={() => setShowMassEditApptModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>

            <Text style={{ marginBottom: 5 }}>Select Appointment Title:</Text>
            {uniqueAppointments.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={{
                  padding: 10,
                  backgroundColor:
                    selectedMassApptId === appt.id ? "#007AFF" : "#eee",
                  marginVertical: 3,
                  borderRadius: 5,
                }}
                onPress={() => {
                  setSelectedMassApptId(appt.id);
                  setCurrentFieldValue(appt.title);
                  setSelectedField("title");
                  setNewFieldValue("");
                }}
              >
                <Text
                  style={{
                    color: selectedMassApptId === appt.id ? "#fff" : "#000",
                  }}
                >
                  {appt.title} | {appt.category ?? ""} | {appt.location ?? ""}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedMassApptId && (
              <>
                <Text style={{ marginTop: 10 }}>Select Field to Edit:</Text>
                {["title", "category", "location", "requirements"].map(
                  (field) => (
                    <TouchableOpacity
                      key={field}
                      style={{
                        padding: 8,
                        backgroundColor:
                          selectedField === field ? "#007AFF" : "#eee",
                        marginVertical: 2,
                        borderRadius: 5,
                      }}
                      onPress={() => {
                        setSelectedField(
                          field as
                            | "title"
                            | "category"
                            | "location"
                            | "requirements"
                        );
                        const appt = uniqueAppointments.find(
                          (a) => a.id === selectedMassApptId
                        );

                        let currentValue = "";
                        if (field === "title") currentValue = appt?.title ?? "";
                        else if (field === "category")
                          currentValue = appt?.category ?? "";
                        else if (field === "location")
                          currentValue = appt?.location ?? "";
                        else if (field === "requirements") {
                          if (
                            Array.isArray(appt?.requirements) &&
                            appt.requirements.length > 0
                          ) {
                            currentValue = appt.requirements.join(", ");
                          } else {
                            currentValue = "None";
                          }
                        }

                        setCurrentFieldValue(currentValue);
                        setNewFieldValue("");
                      }}
                    >
                      <Text
                        style={{
                          color: selectedField === field ? "#fff" : "#000",
                        }}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                <Text style={{ marginTop: 10 }}>Current Value:</Text>
                <Text style={{ marginBottom: 5, fontWeight: "bold" }}>
                  {currentFieldValue && currentFieldValue !== "None"
                    ? currentFieldValue
                    : "None"}
                </Text>
                <TextInput
                  label="New Value"
                  value={newFieldValue}
                  onChangeText={setNewFieldValue}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                  placeholder={
                    selectedField === "requirements"
                      ? "Separate multiple values with commas"
                      : ""
                  }
                />

                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={async () => {
                      if (!selectedMassApptId || !newFieldValue.trim()) return;
                      const appt = uniqueAppointments.find(
                        (a) => a.id === selectedMassApptId
                      );
                      if (!appt) return;

                      const field = selectedField;
                      let valueToUpdate: any = newFieldValue;

                      // Convert comma-separated string to array for text[] field
                      if (field === "requirements") {
                        valueToUpdate = newFieldValue
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean);
                      }

                      const { error } = await supabase
                        .from("appointments")
                        .update({ [field]: valueToUpdate })
                        .eq("user_id", patientId)
                        .eq("title", appt.title);

                      if (error) {
                        Alert.alert(
                          "Error",
                          "Failed to update appointments: " + error.message
                        );
                        console.error(error);
                      } else {
                        Alert.alert(
                          "Success",
                          `Updated all "${appt.title}" appointments.`
                        );
                        setShowMassEditApptModal(false);
                        await fetchPatientData();
                      }
                    }}
                    style={styles.submitButton}
                  >
                    Save
                  </Button>
                </View>

                {/* Delete All Button */}
                <View style={[styles.buttonRow, { marginTop: 10 }]}>
                  <Button
                    mode="contained"
                    style={styles.deleteButton}
                    onPress={() => {
                      const appt = uniqueAppointments.find(
                        (a) => a.id === selectedMassApptId
                      );
                      if (!appt) return;

                      Alert.alert(
                        "Confirm Delete",
                        `Are you sure you want to delete all "${appt.title}" appointments for this patient?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              const { error } = await supabase
                                .from("appointments")
                                .delete()
                                .eq("user_id", patientId)
                                .eq("title", appt.title);

                              if (error) {
                                Alert.alert(
                                  "Error",
                                  "Failed to delete appointments: " +
                                    error.message
                                );
                                console.error(error);
                              } else {
                                Alert.alert(
                                  "Success",
                                  `Deleted all "${appt.title}" appointments.`
                                );
                                setShowMassEditApptModal(false);
                                await fetchPatientData();
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    Delete All
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Mass edit medications modal */}
      <Modal
        visible={showMassEditMedModal}
        onRequestClose={() => setShowMassEditMedModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Mass Edit Medications</Text>

            <View style={[styles.buttonRow, { marginBottom: 10 }]}>
              <Button
                mode="outlined"
                onPress={() => setShowMassEditMedModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>

            <Text style={{ marginBottom: 5 }}>Select Medication:</Text>
            {uniqueMeds.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={{
                  padding: 10,
                  backgroundColor:
                    selectedMassMedId === med.id ? "#007AFF" : "#eee",
                  marginVertical: 3,
                  borderRadius: 5,
                }}
                onPress={() => {
                  setSelectedMassMedId(med.id);
                  setCurrentFieldValue(med.name);
                  setSelectedField("name");
                  setNewFieldValue("");
                }}
              >
                <Text
                  style={{
                    color: selectedMassMedId === med.id ? "#fff" : "#000",
                  }}
                >
                  {med.name} | {med.frequency ?? ""} | {med.notes ?? ""}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedMassMedId && (
              <>
                <Text style={{ marginTop: 10 }}>Select Field to Edit:</Text>
                {["name", "frequency", "notes"].map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={{
                      padding: 8,
                      backgroundColor:
                        selectedField === field ? "#007AFF" : "#eee",
                      marginVertical: 2,
                      borderRadius: 5,
                    }}
                    onPress={() => {
                      setSelectedField(field as "name" | "frequency" | "notes");
                      const med = uniqueMeds.find(
                        (m) => m.id === selectedMassMedId
                      );
                      setCurrentFieldValue(
                        field === "name"
                          ? med?.name ?? ""
                          : field === "frequency"
                          ? med?.frequency ?? ""
                          : med?.notes ?? ""
                      );
                      setNewFieldValue("");
                    }}
                  >
                    <Text
                      style={{
                        color: selectedField === field ? "#fff" : "#000",
                      }}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={{ marginTop: 10 }}>Current Value:</Text>
                <Text style={{ marginBottom: 5, fontWeight: "bold" }}>
                  {currentFieldValue}
                </Text>

                <TextInput
                  label="New Value"
                  value={newFieldValue}
                  onChangeText={setNewFieldValue}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />

                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={async () => {
                      if (!selectedMassMedId || !newFieldValue.trim()) return;
                      const med = uniqueMeds.find(
                        (m) => m.id === selectedMassMedId
                      );
                      if (!med) return;

                      const field = selectedField;
                      const { error } = await supabase
                        .from("trial_medications")
                        .update({ [field]: newFieldValue })
                        .eq("user_id", patientId)
                        .eq("name", med.name);

                      if (error) {
                        Alert.alert(
                          "Error",
                          "Failed to update medications: " + error.message
                        );
                        console.error(error);
                      } else {
                        Alert.alert(
                          "Success",
                          `Updated all "${med.name}" entries.`
                        );
                        setShowMassEditMedModal(false);
                        await fetchPatientData();
                      }
                    }}
                    style={styles.submitButton}
                  >
                    Save
                  </Button>
                </View>

                {/* New Delete Button */}
                <View style={[styles.buttonRow, { marginTop: 10 }]}>
                  <Button
                    mode="contained"
                    style={styles.deleteButton}
                    onPress={() => {
                      const med = uniqueMeds.find(
                        (m) => m.id === selectedMassMedId
                      );
                      if (!med) return;

                      Alert.alert(
                        "Confirm Delete",
                        `Are you sure you want to delete all "${med.name}" medications for this patient?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              const { error } = await supabase
                                .from("trial_medications")
                                .delete()
                                .eq("user_id", patientId)
                                .eq("name", med.name);

                              if (error) {
                                Alert.alert(
                                  "Error",
                                  "Failed to delete medications: " +
                                    error.message
                                );
                                console.error(error);
                              } else {
                                Alert.alert(
                                  "Success",
                                  `Deleted all "${med.name}" medications.`
                                );
                                setShowMassEditMedModal(false);
                                await fetchPatientData();
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    Delete All
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
                <Text
                  style={[
                    styles.trialOptionText,
                    selectedTrial === trial.id && styles.activeTrialOptionText,
                  ]}
                >
                  {trial.name} (Phase {trial.trial_phase ?? trial.phase ?? "-"})
                </Text>
              </TouchableOpacity>
            ))}

            {/* Date input appears only after trial selected */}
            {selectedTrial && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>Enter Start Date (optional) : YYYY-MM-DD</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={startDateInput}
                  onChangeText={setStartDateInput}
                />
                <Text style={styles.hintText}>
                  Leave blank to use today’s date.
                </Text>
              </View>
            )}

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

      {/* Add/Edit Medication Modal */}
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
            <TextInput
              label="Scheduled Date - (YYYY-MM-DD)"
              value={editScheduledDate}
              onChangeText={setEditScheduledDate}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={deleteEditMedication}
                style={styles.deleteButton}
              >
                Delete
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowEditMedModal(false)}
                style={styles.closeButton}
              >
                Close
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

      <Modal
        visible={showEditApptModal}
        onRequestClose={() => setShowEditApptModal(false)}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAppointment ? "Edit Appointment" : "New Appointment"}
            </Text>

            <TextInput
              label="Title"
              value={editApptTitle}
              onChangeText={setEditApptTitle}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Category"
              value={editApptCategory}
              onChangeText={setEditApptCategory}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Location"
              value={editApptLocation}
              onChangeText={setEditApptLocation}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Date (YYYY-MM-DD)"
              value={editApptDate}
              onChangeText={setEditApptDate}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Time (HH:MM) - 24hr - leave empty for no time"
              value={editApptTime}
              onChangeText={setEditApptTime}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Requirements (comma separated)"
              value={editApptRequirements}
              onChangeText={setEditApptRequirements}
              mode="outlined"
              multiline
              style={{ marginBottom: 10 }}
            />

            <View style={styles.buttonRow}>
              {editingAppointment && (
                <Button
                  mode="contained"
                  onPress={deleteEditAppointment}
                  style={styles.deleteButton}
                >
                  Delete
                </Button>
              )}
              <Button
                mode="outlined"
                onPress={() => {
                  setShowEditApptModal(false);
                  setEditingAppointment(null);
                }}
                style={styles.closeButton}
              >
                Close
              </Button>
              <Button
                mode="contained"
                onPress={submitEditAppointment}
                style={styles.submitButton}
              >
                {editingAppointment ? "Save" : "Add"}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export { PatientListScreen as default, PatientProfileScreen };
