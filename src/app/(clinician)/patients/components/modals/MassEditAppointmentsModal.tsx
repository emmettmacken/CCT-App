import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";
import { Appointment } from "@/src/types/patients";

interface MassEditAppointmentsModalProps {
  visible: boolean;
  onClose: () => void;
  appointments: Appointment[];
  selectedAppointmentId: string | null;
  onSelectAppointment: (appointment: Appointment) => void;
  selectedField: "title" | "category" | "location" | "requirements";
  onSelectField: (
    field: "title" | "category" | "location" | "requirements"
  ) => void;
  currentValue: string;
  newValue: string;
  onNewValueChange: (value: string) => void;
  onSave: () => void;
  onDeleteAll: () => void;
}

const MassEditAppointmentsModal: React.FC<MassEditAppointmentsModalProps> = ({
  visible,
  onClose,
  appointments,
  selectedAppointmentId,
  onSelectAppointment,
  selectedField,
  onSelectField,
  currentValue,
  newValue,
  onNewValueChange,
  onSave,
  onDeleteAll,
}) => (
  <Modal
    visible={visible}
    onRequestClose={onClose}
    animationType="slide"
    presentationStyle="pageSheet"
  >
    <SafeAreaView style={styles.modalContainer} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Mass Edit Appointments</Text>

        <View style={[styles.buttonRow, { marginBottom: 10 }]}>
          <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>
            Cancel
          </Button>
        </View>

        <Text style={{ marginBottom: 5 }}>Select Appointment Title:</Text>
        {appointments.map((appointment) => (
          <TouchableOpacity
            key={appointment.id}
            style={{
              padding: 10,
              backgroundColor:
                selectedAppointmentId === appointment.id ? "#007AFF" : "#eee",
              marginVertical: 3,
              borderRadius: 5,
            }}
            onPress={() => onSelectAppointment(appointment)}
          >
            <Text
              style={{
                color:
                  selectedAppointmentId === appointment.id ? "#fff" : "#000",
              }}
            >
              {appointment.title} | {appointment.category ?? ""} |{" "}
              {appointment.location ?? ""}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedAppointmentId && (
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
                  onPress={() =>
                    onSelectField(
                      field as "title" | "category" | "location" | "requirements"
                    )
                  }
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
              {currentValue && currentValue !== "None" ? currentValue : "None"}
            </Text>
            <TextInput
              label="New Value"
              value={newValue}
              onChangeText={onNewValueChange}
              mode="outlined"
              style={{ marginBottom: 10 }}
              placeholder={
                selectedField === "requirements"
                  ? "Separate multiple values with commas"
                  : ""
              }
            />

            <View style={styles.buttonRow}>
              <Button mode="contained" onPress={onSave} style={styles.submitButton}>
                Save
              </Button>
            </View>

            <View style={[styles.buttonRow, { marginTop: 10 }]}>
              <Button mode="contained" style={styles.deleteButton} onPress={onDeleteAll}>
                Delete All
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default MassEditAppointmentsModal;
