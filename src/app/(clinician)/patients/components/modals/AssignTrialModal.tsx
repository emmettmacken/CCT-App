import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/src/styles/patients.styles";

interface TrialOption {
  id: string;
  name: string;
  trial_phase?: string | null;
  phase?: string | null;
}

interface AssignTrialModalProps {
  visible: boolean;
  trials: TrialOption[];
  selectedTrialId: string | null;
  onSelectTrial: (trialId: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const AssignTrialModal: React.FC<AssignTrialModalProps> = ({
  visible,
  trials,
  selectedTrialId,
  onSelectTrial,
  startDate,
  onStartDateChange,
  onClose,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    onRequestClose={onClose}
    presentationStyle="pageSheet"
    animationType="slide"
  >
    <SafeAreaView style={styles.modalContainer} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Assign Trial</Text>

        {trials.map((trial) => (
          <TouchableOpacity
            key={trial.id}
            style={[
              styles.trialOption,
              selectedTrialId === trial.id && styles.activeTrialOption,
            ]}
            onPress={() => onSelectTrial(trial.id)}
          >
            <Text
              style={[
                styles.trialOptionText,
                selectedTrialId === trial.id && styles.activeTrialOptionText,
              ]}
            >
              {trial.name} (Phase {trial.trial_phase ?? trial.phase ?? "-"})
            </Text>
          </TouchableOpacity>
        ))}

        {selectedTrialId && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Enter Start Date (optional) : YYYY-MM-DD</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={onStartDateChange}
            />
            <Text style={styles.hintText}>Leave blank to use today’s date.</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={!selectedTrialId}
            style={styles.submitButton}
          >
            Confirm
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default AssignTrialModal;
