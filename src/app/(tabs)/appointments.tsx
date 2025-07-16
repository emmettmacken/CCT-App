import React, { useState, useEffect } from 'react';
import { Text, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { styles } from '../../styles/appointments.styles';
import { Appointment, AppointmentData } from '../../types/appointments';
import AppointmentModal from '../../components/AppointmentModal';

const MockData: Record<string, any> = {
  '2025-07-22': {
    customStyles: {
      container: {
        backgroundColor: '#3f51b5',
        borderRaadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
      },
      text: {
        color: '#ffffff',
      }
    },
    appointmentData: {
      dateTime: '2025-07-22T15:00:00',
      location: 'Clinic A',
      description: 'Follow-up appointment with Dr. Smith',
      duration: 30,
      type: 'Follow-up',
      clinician_name: 'Dr. John Smith',
      clinician_contact: 'johnsmith@hse.ie',
      fasting_required: false,
      medications_to_avoid: 'Avoid blood thinners like aspirin and warfarin.',
      special_instructions: 'Bring your medical records and any current medications.'
    }
  },
  '2025-07-25': {
    customStyles: {
      container: {
        backgroundColor: '#3f51b5',
        borderRaadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
      },
      text: {
        color: '#ffffff',
      }
    },
    appointmentData: {
      dateTime: '2025-07-25T11:00:00',
      location: 'Clinic B',
      description: 'Treatment Administration with Dr. Doe',
      duration: 60,
      type: 'Treatment Administration',
      clinician_name: 'Dr. Jane Doe',
      clinician_contact: 'janedoe@hse.ie',
      fasting_required: true,
      medications_to_avoid: 'Avoid anti-inlfammatory medications.',
      special_instructions: 'Take anti-nausea medication 1 hour before the appointment and arrange transport home.'
    }
  },
  '2025-07-28': {
    customStyles: {
      container: {
        backgroundColor: '#3f51b5',
        borderRaadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
      },
      text: {
        color: '#ffffff',
      }
    },
    appointmentData: {
      dateTime: '2025-07-28T09:00:00',
      location: 'Radiology Dept',
      description: 'CT Scan with Dr. Brown',
      duration: 40,
      type: 'CT Scan',
      clinician_name: 'Dr. Clancy Brown',
      clinician_contact: 'clancybrown@hse.ie',
      fasting_required: true,
      medications_to_avoid: 'N/A',
      special_instructions: 'No metal objects, wear comfortable clothing.'
    }
  },
};

const CalendarScreen = () => {
  const [appointments, setAppointments] = useState<Record<string, AppointmentData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setAppointments(MockData);
      setLoading(false);
    }, 500); // simulate brief delay
  }, []);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const appointmentEntry = appointments[day.dateString];
    if (appointmentEntry?.appointmentData) {
      setSelectedAppointment(appointmentEntry.appointmentData);
      setModalVisible(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading calendar...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Appointments</Text>
      <Text style={styles.subtitle}>Tap on a date to view details</Text>
      <Text style={styles.attendance}>
        If you cannot attend your scheduled appointment, please contact Clinical Trials Office at 087 382 4221 at your earliest convenience
      </Text>
      <Calendar
        current={'2025-07-16'}
        minDate={'2025-07-16'}
        maxDate={'2025-12-31'}
        markingType={'custom'}
        markedDates={appointments}
        onDayPress={handleDayPress}
        firstDay={1}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#3f51b5',
          selectedDayBackgroundColor: '#3f51b5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3f51b5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#3f51b5',
          selectedDotColor: '#ffffff',
          arrowColor: '#3f51b5',
          monthTextColor: '#3f51b5',
          indicatorColor: '#3f51b5',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
        style={styles.calendar}
      />

      <AppointmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        appointment={selectedAppointment}
      />
    </SafeAreaView>
  );
};

export default CalendarScreen;