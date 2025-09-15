import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { Card } from "react-native-paper";
import { styles } from "../styles/appointments.styles";
import { Appointment } from "../types/appointments";
import { supabase } from "../../backend/supabaseClient";

interface Props {
  visible: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const AppointmentModal: React.FC<Props> = ({ visible, onClose, appointment }) => {
  const [editingTime, setEditingTime] = useState(false);
  const [patientTime, setPatientTime] = useState<string | null>(null);

  // Initialize patientTime with appointment.time if it exists
  useEffect(() => {
    if (appointment?.time) {
      setPatientTime(appointment.time);
    }
  }, [appointment]);

  if (!appointment) return null;

  // Format HH:MM → h:mm AM/PM
  const formatTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  // Save patient time to Supabase
  const savePatientTime = async (id: string, time: string) => {
    if (!id || !time) {
      console.error("Missing id or time:", id, time);
      return;
    }

    const trimmedId = id.trim();
    const trimmedTime = time.trim();

    const { data, error } = await supabase
      .from("appointments")
      .update({ time: trimmedTime })
      .eq("id", trimmedId)
      .select();

    if (error) console.error("Error updating patient time:", error);
    else console.log("Patient time updated:", data);
  };

  const handleSaveTime = () => {
    if (patientTime?.trim() && appointment.id) {
      savePatientTime(appointment.id, patientTime.trim());
    }
    setEditingTime(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Appointment Details</Text>

            {/* Title */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title:</Text>
              <Text style={styles.detailValue}>
                {appointment.title}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {appointment.date
                  ? new Date(appointment.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"}
              </Text>
            </View>

            {/* Time (editable) */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              {editingTime ? (
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (24h format)"
                  value={patientTime || ""}
                  onChangeText={setPatientTime}
                  onSubmitEditing={handleSaveTime}
                  onBlur={handleSaveTime}
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingTime(true)}>
                  <Text style={styles.time}>
                    {patientTime ? formatTime(patientTime) : "Enter time given by clinic"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{appointment.location}</Text>
            </View>

            {/* Preparation Requirements */}
            <Card style={styles.requirementsCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>Preparation Requirements</Text>
                {appointment.requirements && appointment.requirements.length > 0 && (
                  <Text style={styles.requirementText}>
                    • {appointment.requirements.join(", ")}
                  </Text>
                )}
              </Card.Content>
            </Card>

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AppointmentModal;