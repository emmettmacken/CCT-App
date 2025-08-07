import React, { useState } from 'react';
import { View, Text, ScrollView, Modal } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { AdditionalMedication } from '../types/medications';
import { supabase } from '../../backend/supabaseClient';
import { styles } from '../styles/medications.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  refreshMeds: (meds: AdditionalMedication[]) => void;
}

export const AddAdditionalMedModal: React.FC<Props> = ({ visible, onClose, refreshMeds }) => {
  const [newMed, setNewMed] = useState<Omit<AdditionalMedication, 'id'>>({
    name: '',
    dosage: '',
    reason: '',
    side_effects: '',
    patient_id: '',
    taken_at: new Date().toISOString()
  });

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('additional_medications')
        .insert([{
          ...newMed,
          patient_id: user.id,
          taken_at: new Date().toISOString()
        }]);

      if (error) throw error;

      const { data: updated } = await supabase
        .from('additional_medications')
        .select('*')
        .eq('patient_id', user.id)
        .order('taken_at', { ascending: false });

      if (updated) refreshMeds(updated);
      onClose();
      setNewMed({
        name: '',
        dosage: '',
        reason: '',
        side_effects: '',
        patient_id: '',
        taken_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving additional medication:', error);
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Additional Medication</Text>

          <TextInput
            label="Medication Name"
            value={newMed.name}
            onChangeText={text => setNewMed({ ...newMed, name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Dosage"
            value={newMed.dosage}
            onChangeText={text => setNewMed({ ...newMed, dosage: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Reason for taking"
            value={newMed.reason}
            onChangeText={text => setNewMed({ ...newMed, reason: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Side effects (if any)"
            value={newMed.side_effects}
            onChangeText={text => setNewMed({ ...newMed, side_effects: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={onClose} style={styles.cancelButton}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              style={styles.submitButton}
              disabled={!newMed.name || !newMed.dosage}
            >
              Save
            </Button>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
