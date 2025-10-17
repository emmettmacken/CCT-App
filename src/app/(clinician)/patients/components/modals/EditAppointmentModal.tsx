import React from "react";
import { Modal, ScrollView, Switch, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";

interface EditAppointmentModalProps {
  visible: boolean;
  isEditing: boolean;
  title: string;
  category: string;
  location: string;
  date: string;
  time: string;
  requirements: string;
  fastingRequired: boolean | null;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onRequirementsChange: (value: string) => void;
  onFastingRequiredChange: (value: boolean) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: () => void;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  visible,
  isEditing,
  title,
  category,
  location,
  date,
  time,
  requirements,
  fastingRequired,
  onTitleChange,
  onCategoryChange,
  onLocationChange,
  onDateChange,
  onTimeChange,
  onRequirementsChange,
  onFastingRequiredChange,
  onClose,
  onDelete,
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
        <Text style={styles.modalTitle}>
          {isEditing ? "Edit Appointment" : "New Appointment"}
        </Text>

        <TextInput
          label="Title"
          value={title}
          onChangeText={onTitleChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Category"
          value={category}
          onChangeText={onCategoryChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Location"
          value={location}
          onChangeText={onLocationChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={onDateChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Time (HH:MM) - 24hr - leave empty for no time"
          value={time}
          onChangeText={onTimeChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Requirements (comma separated)"
          value={requirements}
          onChangeText={onRequirementsChange}
          mode="outlined"
          multiline
          style={{ marginBottom: 10 }}
        />
        <Text style={{ marginBottom: 4, fontWeight: "500" }}>Fasting Required?</Text>
        <Switch
          value={!!fastingRequired}
          onValueChange={onFastingRequiredChange}
          style={{ marginBottom: 10 }}
        />

        <View style={styles.buttonRow}>
          {isEditing && onDelete && (
            <Button mode="contained" onPress={onDelete} style={styles.deleteButton}>
              Delete
            </Button>
          )}
          <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
            Close
          </Button>
          <Button mode="contained" onPress={onSubmit} style={styles.submitButton}>
            {isEditing ? "Save" : "Add"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default EditAppointmentModal;
