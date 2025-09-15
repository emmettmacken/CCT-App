import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, IconButton } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { supabase } from '../../backend/supabaseClient';

type SideEffectRecord = {
  id?: string;
  user_id?: string | null;
  description: string;
  start_date: string;
  end_date?: string | null;
  medication_taken?: string | null;
  created_at?: string;
};

type SideEffectModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSaved?: (record: SideEffectRecord) => void;
};

const SideEffectModal: React.FC<SideEffectModalProps> = ({ visible, onDismiss, onSaved }) => {
  const [description, setDescription] = useState<string>('');
  const [medicationTaken, setMedicationTaken] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setDescription('');
    setMedicationTaken('');
    setStartDate(new Date());
    setEndDate(null);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);

    if (!description.trim()) {
      setError('Please enter a description of the side effect.');
      return;
    }

    if (!startDate) {
      setError('Please select a start date and time.');
      return;
    }

    if (endDate && startDate > endDate) {
      setError('End date must be the same or after the start date.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const payload: SideEffectRecord = {
        user_id: user.id,
        description: description.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        medication_taken: medicationTaken ? medicationTaken.trim() : null,
      };

      const { data, error: insertError } = await supabase
        .from('side_effects')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      onSaved?.(data as SideEffectRecord);
      resetForm();
      onDismiss?.();
    } catch (e: any) {
      console.error('Error saving side effect:', e);
      setError('Failed to save side effect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderDateTime = (d: Date | null) => (d ? format(d, 'PPP p') : 'Not set');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!saving) {
          resetForm();
          onDismiss?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Log a Side Effect</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => {
                    if (!saving) {
                      resetForm();
                      onDismiss?.();
                    }
                  }}
                />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <TextInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  editable={!saving}
                />

                <View style={styles.row}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.label}>Start (date & time)</Text>
                    <TouchableOpacity
                      onPress={() => setShowStartPicker(true)}
                      style={styles.dateButton}
                      disabled={saving}
                    >
                      <Text style={styles.dateText}>{renderDateTime(startDate)}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateColumn}>
                    <Text style={styles.label}>End (date & time)</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndPicker(true)}
                      style={styles.dateButton}
                      disabled={saving}
                    >
                      <Text style={styles.dateText}>{renderDateTime(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  label="Medications taken (if any)"
                  value={medicationTaken}
                  onChangeText={setMedicationTaken}
                  mode="outlined"
                  style={styles.input}
                  editable={!saving}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      resetForm();
                      onDismiss?.();
                    }}
                    disabled={saving}
                    style={styles.button}
                  >
                    Cancel
                  </Button>

                  <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={[styles.button, styles.saveButton]}
                  >
                    Save
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Date Pickers */}
        <DateTimePickerModal
          isVisible={showStartPicker}
          mode="datetime"
          date={startDate || new Date()}
          onConfirm={(date) => {
            setShowStartPicker(false);
            setStartDate(date);
            if (endDate && date > endDate) setEndDate(null);
          }}
          onCancel={() => setShowStartPicker(false)}
          is24Hour={false}
        />

        <DateTimePickerModal
          isVisible={showEndPicker}
          mode="datetime"
          date={
            endDate ||
            (startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : new Date())
          }
          onConfirm={(date) => {
            setShowEndPicker(false);
            setEndDate(date);
          }}
          onCancel={() => setShowEndPicker(false)}
          is24Hour={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  flex: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  content: {
    paddingBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateColumn: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  dateText: {
    color: '#222',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  button: {
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#3f51b5',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 8,
  },
});

export default SideEffectModal;
