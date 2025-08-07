import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import { TimePickerModal } from 'react-native-paper-dates';
import { useMedications } from '../../hooks/useMedications';
import { Medication } from '../../types/medications';
import { styles } from '../../styles/medications.styles';

import { TrialMedicationsSection } from '../../components/ui/TrialMedicationsSections';
import { AdditionalMedicationsSection } from '../../components/ui/AdditionalMedicationsSection';
import { AddAdditionalMedModal } from '../../components/AddAdditionalMedModal';

const MedicationTrackingScreen = () => {
  const {
    trialMedications,
    medicationLogs,
    additionalMeds,
    loading,
    setMedicationLogs,
    setAdditionalMeds
  } = useMedications();

  const [selectedTrialMed, setSelectedTrialMed] = useState<Medication | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  const handleTimeConfirm = async ({ hours, minutes }: { hours: number; minutes: number }) => {
    // Your insert logic here
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading medications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TrialMedicationsSection
          trialMedications={trialMedications}
          medicationLogs={medicationLogs}
          selectedTrialMed={selectedTrialMed}
          setSelectedTrialMed={setSelectedTrialMed}
          onLogPress={() => setTimePickerVisible(true)}
        />

        <AdditionalMedicationsSection
          additionalMeds={additionalMeds}
          onAddPress={() => setShowAddMedModal(true)}
        />
      </ScrollView>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
        hours={new Date().getHours()}
        minutes={new Date().getMinutes()}
      />

      <AddAdditionalMedModal
        visible={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        refreshMeds={setAdditionalMeds}
      />
    </SafeAreaView>
  );
};

export default MedicationTrackingScreen;
