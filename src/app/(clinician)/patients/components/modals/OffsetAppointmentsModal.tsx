import React from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";

interface OffsetAppointmentsModalProps {
  visible: boolean;
  onClose: () => void;
  offsetDays: string;
  onOffsetDaysChange: (value: string) => void;
  appointmentsCount: number;
  onConfirm: () => void;
  loading: boolean;
}

const OffsetAppointmentsModal: React.FC<OffsetAppointmentsModalProps> = ({
  visible,
  onClose,
  offsetDays,
  onOffsetDaysChange,
  appointmentsCount,
  onConfirm,
  loading,
}) => (
  <Modal
    visible={visible}
    onRequestClose={onClose}
    animationType="slide"
    presentationStyle="pageSheet"
  >
    <SafeAreaView style={styles.modalContainer} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Offset Appointments</Text>
        <Text>{`You have ${appointmentsCount} appointment(s) scheduled today or in the future.`}</Text>

        <TextInput
          label="Days to offset"
          value={offsetDays}
          onChangeText={onOffsetDaysChange}
          keyboardType="numeric"
          mode="outlined"
          style={{ marginVertical: 10 }}
        />

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={!offsetDays || isNaN(parseInt(offsetDays, 10)) || loading}
            style={styles.submitButton}
          >
            Confirm
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default OffsetAppointmentsModal;
