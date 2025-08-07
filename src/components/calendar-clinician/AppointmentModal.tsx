import React, { useState } from 'react';
import { View, Modal, ScrollView } from 'react-native';
import { Button, Divider, List, RadioButton, Text } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, addDays } from 'date-fns';
import { supabase } from '../../../backend/supabaseClient';
import { Appointment } from '../../types/clinCalendar';
import { styles } from '../../styles/clinicianCalendar';

type Props = {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
};

const AppointmentModal = ({ visible, appointment, onClose }: Props) => {
  const [rescheduleMode, setRescheduleMode] = useState<'single' | 'all'>('single');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [newDate, setNewDate] = useState<Date>(new Date());

  const handleReschedule = async () => {
    if (!appointment) return;

    try {
      if (rescheduleMode === 'single') {
        await supabase
          .from('appointments')
          .update({ 
            date: newDate.toISOString(),
            status: 'scheduled'
          })
          .eq('id', appointment.id);
      } else {
        await supabase
          .from('appointments')
          .update({ 
            date: addDays(parseISO(appointment.date), 
              (newDate.getTime() - parseISO(appointment.date).getTime()) / (1000 * 60 * 60 * 24)),
            status: 'scheduled'
          })
          .eq('patient_id', appointment.patient_id)
          .gte('date', appointment.date);
      }

      onClose();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    }
  };

  const handleStatusUpdate = async (status: 'cancelled' | 'completed') => {
    if (!appointment) return;
    try {
      await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointment.id);
      onClose();
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {appointment && (
            <>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              
              <List.Item
                title="Patient"
                description={appointment.patient_name}
                left={() => <List.Icon icon="account" />}
              />
              <Divider />

              <List.Item
                title="Date & Time"
                description={`${format(parseISO(appointment.date), 'PPPPp')}`}
                left={() => <List.Icon icon="calendar" />}
              />
              <Divider />

              <List.Item
                title="Type"
                description={appointment.type}
                left={() => <List.Icon icon="medical-bag" />}
              />
              <Divider />

              <List.Item
                title="Status"
                description={appointment.status}
                left={() => <List.Icon icon="information" />}
              />
              <Divider />

              {appointment.notes && (
                <>
                  <List.Item
                    title="Notes"
                    description={appointment.notes}
                    left={() => <List.Icon icon="note" />}
                  />
                  <Divider />
                </>
              )}

              <Text style={styles.sectionTitle}>Reschedule Appointment</Text>

              <RadioButton.Group
                onValueChange={value => setRescheduleMode(value as 'single' | 'all')}
                value={rescheduleMode}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="single" />
                  <Text style={styles.radioLabel}>This appointment only</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="all" />
                  <Text style={styles.radioLabel}>All future appointments for this patient</Text>
                </View>
              </RadioButton.Group>

              <Button
                mode="outlined"
                onPress={() => setDatePickerVisible(true)}
                style={styles.datePickerButton}
              >
                Select New Date
              </Button>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={(date: Date) => {
                  setDatePickerVisible(false);
                  setNewDate(date);
                }}
                onCancel={() => setDatePickerVisible(false)}
                minimumDate={new Date()}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleReschedule}
                  style={styles.actionButton}
                  disabled={!newDate}
                >
                  Reschedule
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleStatusUpdate('completed')}
                  style={[styles.actionButton, styles.completeButton]}
                  disabled={appointment.status === 'completed'}
                >
                  Mark Complete
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleStatusUpdate('cancelled')}
                  style={[styles.actionButton, styles.cancelButton]}
                  disabled={appointment.status === 'cancelled'}
                >
                  Cancel
                </Button>
              </View>

              <Button
                mode="text"
                onPress={onClose}
                style={styles.closeButton}
              >
                Close
              </Button>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default AppointmentModal;