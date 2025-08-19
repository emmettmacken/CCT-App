import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import { TimePickerModal } from 'react-native-paper-dates';
import { supabase } from '../../../backend/supabaseClient';
import { Medication } from '../../types/medications';
import { styles } from '../../styles/medications.styles';

import { TrialMedicationsSection } from '../../components/ui/TrialMedicationsSections';
import { AdditionalMedicationsSection } from '../../components/ui/AdditionalMedicationsSection';
import { AdditionalMedication } from '../../types/medications';
import { AddAdditionalMedModal } from '../../components/AddAdditionalMedModal';

const MedicationTrackingScreen = () => {
  const [trialMedications, setTrialMedications] = useState<Medication[]>([]);
  const [additionalMeds, setAdditionalMeds] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrialMed, setSelectedTrialMed] = useState<Medication | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  const fetchMedications = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    // Fetch trial medications
    const { data: trialData, error: trialError } = await supabase
      .from('trial_medications')
      .select('*')
      .eq('user_id', userId);

    if (trialError) console.log('Error fetching trial meds:', trialError.message);
    else setTrialMedications(trialData || []);

    // Fetch additional medications
    const { data: additionalData, error: additionalError } = await supabase
      .from('additional_medications')
      .select('*')
      .eq('user_id', userId);

    if (additionalError) console.log('Error fetching additional meds:', additionalError.message);
    else setAdditionalMeds(additionalData || []);

    // Fetch medication logs
    const { data: logsData, error: logsError } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId);

    if (logsError) console.log('Error fetching logs:', logsError.message);
    else setMedicationLogs(logsData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleTimeConfirm = async ({ hours, minutes }: { hours: number; minutes: number }) => {
    if (!selectedTrialMed) return;

    const taken_at = new Date();
    taken_at.setHours(hours, minutes, 0);

    const { error } = await supabase.from('medication_logs').insert({
      medication_id: selectedTrialMed.id,
      dosage: selectedTrialMed.dosage,
      taken_at: taken_at.toISOString(),
      type: 'trial',
      user_id: (await supabase.auth.getUser())?.data.user?.id
    });

    if (error) console.log('Error logging medication:', error.message);
    else fetchMedications(); // Refresh logs
    setTimePickerVisible(false);
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <Text>Loading medications...</Text>
    </SafeAreaView>
  );

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
          additionalMeds={additionalMeds as unknown as AdditionalMedication[]}
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
        refreshMeds={(meds: AdditionalMedication[]) => setAdditionalMeds(meds as unknown as Medication[])}
      />
    </SafeAreaView>
  );
};

export default MedicationTrackingScreen;