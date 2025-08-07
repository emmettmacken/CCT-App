import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import FilterBar from '../../components/calendar-clinician/FilterBar';
import CalendarView from '../../components/calendar-clinician/CalendarView';
import AppointmentModal from '../../components/calendar-clinician/AppointmentModal'; // You can modularize this similarly
import { getMarkedDates, getAppointmentsForDay } from '../../components/calendar-clinician/calendarUtils';
import { useAppointments } from '../../hooks/useAppointments';
import { Appointment } from '../../types/clinCalendar';
import { styles } from '../../styles/clinicianCalendar';

const ClinicianCalendarScreen = () => {
  const { appointments, patients, loading } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const filteredAppointments = appointments.filter(a =>
    (selectedPatient === 'all' || a.patient_id === selectedPatient) &&
    (selectedType === 'all' || a.type === selectedType)
  );

  const handleDayPress = (day: { dateString: string }) => {
    const dayAppointments = getAppointmentsForDay(filteredAppointments, day.dateString);
    if (dayAppointments.length > 0) {
      setSelectedAppointment(dayAppointments[0]);
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
      <FilterBar
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        viewMode={viewMode}
        setViewMode={setViewMode}
        patients={patients}
      />
      <CalendarView
        markedDates={getMarkedDates(filteredAppointments, selectedAppointment)}
        onDayPress={handleDayPress}
      />
      <AppointmentModal
        visible={modalVisible}
        appointment={selectedAppointment}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ClinicianCalendarScreen;