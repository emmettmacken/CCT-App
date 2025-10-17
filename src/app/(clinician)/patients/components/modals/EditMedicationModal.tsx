import React from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";

interface EditMedicationModalProps {
  visible: boolean;
  name: string;
  frequency: string;
  notes: string;
  scheduledDate: string;
  onNameChange: (value: string) => void;
  onFrequencyChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onScheduledDateChange: (value: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

const EditMedicationModal: React.FC<EditMedicationModalProps> = ({
  visible,
  name,
  frequency,
  notes,
  scheduledDate,
  onNameChange,
  onFrequencyChange,
  onNotesChange,
  onScheduledDateChange,
  onDelete,
  onClose,
  onSubmit,
}) => (
  <Modal
    visible={visible}
    onRequestClose={onClose}
    animationType="slide"
    presentationStyle="pageSheet"
  >
    <SafeAreaView style={styles.modalContainer} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Edit Medication</Text>

        <TextInput
          label="Name"
          value={name}
          onChangeText={onNameChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Frequency"
          value={frequency}
          onChangeText={onFrequencyChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={onNotesChange}
          mode="outlined"
          multiline
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Scheduled Date - (YYYY-MM-DD)"
          value={scheduledDate}
          onChangeText={onScheduledDateChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <View style={styles.buttonRow}>
          <Button mode="contained" onPress={onDelete} style={styles.deleteButton}>
            Delete
          </Button>
          <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
            Close
          </Button>
          <Button mode="contained" onPress={onSubmit} style={styles.submitButton}>
            Save
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default EditMedicationModal;
