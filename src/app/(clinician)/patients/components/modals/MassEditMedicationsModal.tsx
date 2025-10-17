import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";
import { Medication } from "@/src/types/patients";

interface MassEditMedicationsModalProps {
  visible: boolean;
  onClose: () => void;
  medications: Medication[];
  selectedMedicationId: string | null;
  onSelectMedication: (medication: Medication) => void;
  selectedField: "name" | "frequency" | "notes";
  onSelectField: (field: "name" | "frequency" | "notes") => void;
  currentValue: string;
  newValue: string;
  onNewValueChange: (value: string) => void;
  onSave: () => void;
  onDeleteAll: () => void;
}

const MassEditMedicationsModal: React.FC<MassEditMedicationsModalProps> = ({
  visible,
  onClose,
  medications,
  selectedMedicationId,
  onSelectMedication,
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
        <Text style={styles.modalTitle}>Mass Edit Medications</Text>

        <View style={[styles.buttonRow, { marginBottom: 10 }]}>
          <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>
            Cancel
          </Button>
        </View>

        <Text style={{ marginBottom: 5 }}>Select Medication:</Text>
        {medications.map((medication) => (
          <TouchableOpacity
            key={medication.id}
            style={{
              padding: 10,
              backgroundColor:
                selectedMedicationId === medication.id ? "#007AFF" : "#eee",
              marginVertical: 3,
              borderRadius: 5,
            }}
            onPress={() => onSelectMedication(medication)}
          >
            <Text
              style={{
                color:
                  selectedMedicationId === medication.id ? "#fff" : "#000",
              }}
            >
              {medication.name} | {medication.frequency ?? ""} |{" "}
              {medication.notes ?? ""}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedMedicationId && (
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
                onPress={() => onSelectField(field as "name" | "frequency" | "notes")}
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
            <Text style={{ marginBottom: 5, fontWeight: "bold" }}>{currentValue}</Text>

            <TextInput
              label="New Value"
              value={newValue}
              onChangeText={onNewValueChange}
              mode="outlined"
              style={{ marginBottom: 10 }}
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

export default MassEditMedicationsModal;
