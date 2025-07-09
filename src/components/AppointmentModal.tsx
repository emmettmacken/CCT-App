import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { format } from 'date-fns';
import { Appointment } from '../types/appointments';
import { styles } from '../styles/appointments.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const AppointmentModal: React.FC<Props> = ({ visible, onClose, appointment }) => {
  if (!appointment) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Appointment Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time:</Text>
              <Text style={styles.detailValue}>
                {format(new Date(appointment.date), 'PPPPp')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {appointment.duration} minutes
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{appointment.type}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{appointment.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Clinician:</Text>
              <Text style={styles.detailValue}>{appointment.clinician_name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{appointment.clinician_contact}</Text>
            </View>

            <Card style={styles.requirementsCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>Preparation Requirements</Text>
                {appointment.fasting_required ? (
                  <Text style={styles.requirementText}>• Fasting required (8 hours before)</Text>
                ) : (
                  <Text style={styles.requirementText}>• No fasting required</Text>
                )}
                {appointment.medications_to_avoid && (
                  <View>
                    <Text style={styles.requirementText}>• Medications to avoid:</Text>
                    <Text style={styles.medicationText}>
                      {appointment.medications_to_avoid}
                    </Text>
                  </View>
                )}
                {appointment.special_instructions && (
                  <Text style={styles.requirementText}>
                    • Special instructions: {appointment.special_instructions}
                  </Text>
                )}
              </Card.Content>
            </Card>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AppointmentModal;