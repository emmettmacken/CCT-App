import React from 'react';
import { View, Text } from 'react-native';
import { Card, List, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../../styles/clinicianhome.styles';
import { Appointment } from '../../types/clinician';

interface Props {
  appointments: Appointment[];
}

const AppointmentsSection: React.FC<Props> = ({ appointments }) => {
  const navigation = useNavigation<any>();

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Today's Appointments"
        titleStyle={styles.cardTitle}
        right={() => <Text style={styles.appointmentCount}>{appointments.length} scheduled</Text>}
      />
      <Card.Content>
        {appointments.length > 0 ? (
          <List.Section>
            {appointments.map(appt => (
              <List.Item
                key={appt.id}
                title={appt.patient_name}
                description={`${appt.type} at ${appt.time}`}
                left={() => (
                  <View style={[
                    styles.statusIndicator,
                    appt.status === 'completed' && styles.completedStatus,
                    appt.status === 'cancelled' && styles.cancelledStatus,
                  ]} />
                )}
                right={() => (
                  <Button 
                    mode="outlined" 
                    onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                    style={styles.viewButton}
                    labelStyle={styles.viewButtonLabel}
                  >
                    View
                  </Button>
                )}
                style={styles.appointmentItem}
              />
            ))}
          </List.Section>
        ) : (
          <Text style={styles.noItemsText}>No appointments scheduled for today</Text>
        )}
      </Card.Content>
    </Card>
  );
};

export default AppointmentsSection;