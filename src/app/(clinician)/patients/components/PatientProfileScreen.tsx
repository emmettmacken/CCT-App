import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, Card, List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import OptionalMedicationAssigner from "@/src/components/OptionalMedicationAssigner";
import PatientMedicationLogBook from "@/src/components/PatientMedicationLogBook";
import PatientNotes from "@/src/components/PatientNotes";
import { styles } from "@/src/styles/patients.styles";
import { Appointment, Medication, Patient } from "@/src/types/patients";

import { supabase } from "../../../../backend/supabaseClient";
import AssignTrialModal from "./modals/AssignTrialModal";
import EditAppointmentModal from "./modals/EditAppointmentModal";
import EditMedicationModal from "./modals/EditMedicationModal";
import MassEditAppointmentsModal from "./modals/MassEditAppointmentsModal";
import MassEditMedicationsModal from "./modals/MassEditMedicationsModal";
import OffsetAppointmentsModal from "./modals/OffsetAppointmentsModal";
import { addDays, formatDate, getAppointmentDateTime, parseDateUTC } from "../utils";

interface PatientProfileScreenProps {
  patientId: string;
  onClose: () => void;
}

const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  patientId,
  onClose,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeTab, setActiveTab] = useState("appointments");
  const [loading, setLoading] = useState(true);
  const [trials, setTrials] = useState<any[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );
  const [editMedName, setEditMedName] = useState("");
  const [editMedFrequency, setEditMedFrequency] = useState("");
  const [editMedNotes, setEditMedNotes] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");

  const [showEditApptModal, setShowEditApptModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [editApptDate, setEditApptDate] = useState("");
  const [editApptTime, setEditApptTime] = useState("");
  const [editApptTitle, setEditApptTitle] = useState("");
  const [editApptCategory, setEditApptCategory] = useState("");
  const [editApptLocation, setEditApptLocation] = useState("");
  const [editApptRequirements, setEditApptRequirements] = useState("");
  const [editApptFastingRequired, setEditApptFastingRequired] = useState<
    boolean | null
  >(null);

  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const [offsetDays, setOffsetDays] = useState("");
  const [appointmentsToOffset, setAppointmentsToOffset] = useState<
    Appointment[]
  >([]);

  const [showMassEditMedModal, setShowMassEditMedModal] = useState(false);
  const [uniqueMeds, setUniqueMeds] = useState<Medication[]>([]);
  const [selectedMassMedId, setSelectedMassMedId] = useState<string | null>(
    null
  );
  const [selectedMedicationField, setSelectedMedicationField] = useState<
    "name" | "frequency" | "notes"
  >("name");
  const [currentMedicationFieldValue, setCurrentMedicationFieldValue] =
    useState("");
  const [newMedicationFieldValue, setNewMedicationFieldValue] = useState("");

  const [showMassEditApptModal, setShowMassEditApptModal] = useState(false);
  const [selectedMassApptId, setSelectedMassApptId] = useState<string | null>(
    null
  );
  const [uniqueAppointments, setUniqueAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentField, setSelectedAppointmentField] = useState<
    "title" | "category" | "location" | "requirements"
  >("title");
  const [currentAppointmentFieldValue, setCurrentAppointmentFieldValue] =
    useState("");
  const [newAppointmentFieldValue, setNewAppointmentFieldValue] = useState("");

  const [startDateInput, setStartDateInput] = useState("");

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
        .select("id, name, trial_phase");
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

              const startDateToInsert =
                startDateInput && startDateInput.trim() !== ""
                  ? startDateInput.trim()
                  : null;

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

              const { data: assessments, error: assessmentsError } = await supabase
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
                const appointmentsToInsert: any[] = [];

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
                          fasting_required: a.fasting_required,
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

                const medsToInsert: any[] = [];

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
    const reqs = Array.isArray(appt.requirements)
      ? appt.requirements.join(", ")
      : appt.requirements ?? "";
    setEditApptRequirements(reqs);
    setEditApptFastingRequired(appt.fasting_required ?? false);
    setShowEditApptModal(true);
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

                const oldDate = parseDateUTC(appt.date);
                const newDate = new Date(oldDate);
                newDate.setUTCDate(newDate.getUTCDate() + days);
                const newDateStr = newDate.toISOString().split("T")[0];

                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === appt.id ? { ...a, date: newDateStr } : a
                  )
                );

                await supabase
                  .from("appointments")
                  .update({ date: newDateStr })
                  .eq("id", appt.id);

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
    const reqArray =
      editApptRequirements && editApptRequirements.trim() !== ""
        ? editApptRequirements.split(",").map((r) => r.trim())
        : null;

    if (!patient) {
      Alert.alert("Error", "Patient data is not loaded.");
      return;
    }

    const appointmentData = {
      user_id: patient.id,
      date: editApptDate,
      time: editApptTime === "" ? null : editApptTime,
      title: editApptTitle,
      category: editApptCategory,
      location: editApptLocation,
      requirements: reqArray,
      fasting_required: editApptFastingRequired,
    };

    if (editingAppointment) {
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

  const handleSelectMassAppointment = (appointment: Appointment) => {
    setSelectedMassApptId(appointment.id);
    setSelectedAppointmentField("title");
    setCurrentAppointmentFieldValue(appointment.title ?? "");
    setNewAppointmentFieldValue("");
  };

  const handleSelectAppointmentField = (
    field: "title" | "category" | "location" | "requirements"
  ) => {
    setSelectedAppointmentField(field);
    const appt = uniqueAppointments.find((a) => a.id === selectedMassApptId);
    if (!appt) return;

    let currentValue = "";
    if (field === "title") currentValue = appt?.title ?? "";
    else if (field === "category") currentValue = appt?.category ?? "";
    else if (field === "location") currentValue = appt?.location ?? "";
    else if (field === "requirements") {
      if (Array.isArray(appt?.requirements) && appt.requirements.length > 0) {
        currentValue = appt.requirements.join(", ");
      } else {
        currentValue = "None";
      }
    }

    setCurrentAppointmentFieldValue(currentValue);
    setNewAppointmentFieldValue("");
  };

  const handleSaveMassAppointments = async () => {
    if (!selectedMassApptId || !newAppointmentFieldValue.trim()) return;
    const appt = uniqueAppointments.find((a) => a.id === selectedMassApptId);
    if (!appt) return;

    const field = selectedAppointmentField;
    let valueToUpdate: any = newAppointmentFieldValue;

    if (field === "requirements") {
      valueToUpdate = newAppointmentFieldValue
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
      Alert.alert("Error", "Failed to update appointments: " + error.message);
      console.error(error);
    } else {
      Alert.alert("Success", `Updated all "${appt.title}" appointments.`);
      setShowMassEditApptModal(false);
      await fetchPatientData();
    }
  };

  const handleDeleteMassAppointments = async () => {
    const appt = uniqueAppointments.find((a) => a.id === selectedMassApptId);
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
                "Failed to delete appointments: " + error.message
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
  };

  const handleSelectMassMedication = (medication: Medication) => {
    setSelectedMassMedId(medication.id);
    setSelectedMedicationField("name");
    setCurrentMedicationFieldValue(medication.name ?? "");
    setNewMedicationFieldValue("");
  };

  const handleSelectMedicationField = (
    field: "name" | "frequency" | "notes"
  ) => {
    setSelectedMedicationField(field);
    const med = uniqueMeds.find((m) => m.id === selectedMassMedId);
    if (!med) return;

    const currentValue =
      field === "name"
        ? med?.name ?? ""
        : field === "frequency"
        ? med?.frequency ?? ""
        : med?.notes ?? "";

    setCurrentMedicationFieldValue(currentValue);
    setNewMedicationFieldValue("");
  };

  const handleSaveMassMedications = async () => {
    if (!selectedMassMedId || !newMedicationFieldValue.trim()) return;
    const med = uniqueMeds.find((m) => m.id === selectedMassMedId);
    if (!med) return;

    const field = selectedMedicationField;
    const { error } = await supabase
      .from("trial_medications")
      .update({ [field]: newMedicationFieldValue })
      .eq("user_id", patientId)
      .eq("name", med.name);

    if (error) {
      Alert.alert(
        "Error",
        "Failed to update medications: " + error.message
      );
      console.error(error);
    } else {
      Alert.alert("Success", `Updated all "${med.name}" entries.`);
      setShowMassEditMedModal(false);
      await fetchPatientData();
    }
  };

  const handleDeleteMassMedications = async () => {
    const med = uniqueMeds.find((m) => m.id === selectedMassMedId);
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
                "Failed to delete medications: " + error.message
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
  };

  if (loading || !patient) {
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
              {appointments.length > 0 && (
                <Button
                  mode="contained"
                  style={[styles.addAppointment, { marginBottom: 10 }]}
                  onPress={() => {
                    setEditingAppointment(null);
                    setEditApptTitle("");
                    setEditApptCategory("");
                    setEditApptLocation("");
                    setEditApptDate("");
                    setEditApptTime("");
                    setEditApptRequirements("");
                    setShowEditApptModal(true);
                  }}
                >
                  Add Appointment
                </Button>
              )}
              {appointments.length > 0 && (
                <Button
                  mode="contained"
                  style={styles.offsetAppointment}
                  onPress={handleOffsetAppointments}
                >
                  Offset Future Appointments
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
                    setSelectedMedicationField("name");
                    setCurrentMedicationFieldValue("");
                    setNewMedicationFieldValue("");
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

        {activeTab === "notes" && <PatientNotes patientId={patientId} />}
      </ScrollView>

      <OffsetAppointmentsModal
        visible={showOffsetModal}
        onClose={() => setShowOffsetModal(false)}
        offsetDays={offsetDays}
        onOffsetDaysChange={setOffsetDays}
        appointmentsCount={appointmentsToOffset.length}
        onConfirm={confirmOffsetAppointments}
        loading={loading}
      />

      <MassEditAppointmentsModal
        visible={showMassEditApptModal}
        onClose={() => setShowMassEditApptModal(false)}
        appointments={uniqueAppointments}
        selectedAppointmentId={selectedMassApptId}
        onSelectAppointment={handleSelectMassAppointment}
        selectedField={selectedAppointmentField}
        onSelectField={handleSelectAppointmentField}
        currentValue={currentAppointmentFieldValue}
        newValue={newAppointmentFieldValue}
        onNewValueChange={setNewAppointmentFieldValue}
        onSave={handleSaveMassAppointments}
        onDeleteAll={handleDeleteMassAppointments}
      />

      <MassEditMedicationsModal
        visible={showMassEditMedModal}
        onClose={() => setShowMassEditMedModal(false)}
        medications={uniqueMeds}
        selectedMedicationId={selectedMassMedId}
        onSelectMedication={handleSelectMassMedication}
        selectedField={selectedMedicationField}
        onSelectField={handleSelectMedicationField}
        currentValue={currentMedicationFieldValue}
        newValue={newMedicationFieldValue}
        onNewValueChange={setNewMedicationFieldValue}
        onSave={handleSaveMassMedications}
        onDeleteAll={handleDeleteMassMedications}
      />

      <AssignTrialModal
        visible={showAssignModal}
        trials={trials}
        selectedTrialId={selectedTrial}
        onSelectTrial={setSelectedTrial}
        startDate={startDateInput}
        onStartDateChange={setStartDateInput}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignTrial}
      />

      <EditMedicationModal
        visible={showEditMedModal}
        name={editMedName}
        frequency={editMedFrequency}
        notes={editMedNotes}
        scheduledDate={editScheduledDate}
        onNameChange={setEditMedName}
        onFrequencyChange={setEditMedFrequency}
        onNotesChange={setEditMedNotes}
        onScheduledDateChange={setEditScheduledDate}
        onDelete={deleteEditMedication}
        onClose={() => setShowEditMedModal(false)}
        onSubmit={submitEditMedication}
      />

      <EditAppointmentModal
        visible={showEditApptModal}
        isEditing={!!editingAppointment}
        title={editApptTitle}
        category={editApptCategory}
        location={editApptLocation}
        date={editApptDate}
        time={editApptTime}
        requirements={editApptRequirements}
        fastingRequired={editApptFastingRequired}
        onTitleChange={setEditApptTitle}
        onCategoryChange={setEditApptCategory}
        onLocationChange={setEditApptLocation}
        onDateChange={setEditApptDate}
        onTimeChange={setEditApptTime}
        onRequirementsChange={setEditApptRequirements}
        onFastingRequiredChange={setEditApptFastingRequired}
        onClose={() => {
          setShowEditApptModal(false);
          setEditingAppointment(null);
        }}
        onDelete={deleteEditAppointment}
        onSubmit={submitEditAppointment}
      />
    </SafeAreaView>
  );
};

export default PatientProfileScreen;
