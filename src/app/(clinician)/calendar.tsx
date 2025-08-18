import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import FilterBar from '../../components/calendar-clinician/FilterBar';
import CalendarView from '../../components/calendar-clinician/CalendarView';
import AppointmentModal from '../../components/calendar-clinician/AppointmentModal';
import { getMarkedDates, getAppointmentsForDay } from '../../components/calendar-clinician/calendarUtils';
import { useAppointments } from '../../hooks/useAppointments';
import { Appointment } from '../../types/clinCalendar';
import { styles } from '../../styles/clinicianCalendar';

const ClinicianCalendarScreen = () => {
  const {appointments, patients, loading } = useAppointments();
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const mockAppointments: Appointment[] = useMemo(() => {
    const today = new Date();
    const formatDateTime = (offsetDays: number, time: string) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const [hours, minutes] = time.split(':').map(Number);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    };

    return [
      {
        id: 'mock-1',
        patient_id: 'p-101',
        patient_name: 'Anne Marie Ryan',
        date: formatDateTime(0, '9:00'),
        time: '9:00',
        type: 'Bloods',
        status: 'scheduled',
        notes: 'Trial bloods to be sent to lab',
      },
      {
        id: 'mock-2',
        patient_id: 'p-102',
        patient_name: 'Sean Treacy',
        date: formatDateTime(1, '11:00'),
        time: '11:00',
        type: 'Follow-up',
        status: 'scheduled',
        notes: 'Follow-up on recent treatment',
      },
      {
        id: 'mock-3',
        patient_id: 'p-103',
        patient_name: 'Cian Cleary',
        date: formatDateTime(2, '14:30'),
        time: '14:30',
        type: 'Consultation',
        status: 'scheduled',
        notes: 'Initial consultation for ISA',
      },
      {
        id: 'mock-4',
        patient_id: 'p-104',
        patient_name: 'Conor Lydon',
        date: formatDateTime(0, '11:30'),
        time: '11:30',
        type: 'Consultation',
        status: 'scheduled',
        notes: 'Initial consultation for ISA',
      },
   ];
  }, []);

  const allAppointments = appointments.length > 0 ? appointments : mockAppointments;

  const filteredAppointments = allAppointments.filter(a =>
    (selectedPatient === 'all' || a.patient_id === selectedPatient) &&
    (selectedType === 'all' || a.type === selectedType)
  );

  const handleDayPress = (day: { dateString: string }) => {
    const dayAppointments = getAppointmentsForDay(filteredAppointments, day.dateString);
    if (dayAppointments.length > 0) {
      setSelectedAppointments(dayAppointments);
      setModalVisible(true);
    }
  };

  if (loading && appointments.length === 0) {
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
        patients={patients.length > 0 ? patients : [
          { id: 'p-101', name: 'Anne Marie Ryan'},
          { id: 'p-102', name: 'Sean Treacy'},
          { id: 'p-103', name: 'Cian Cleary'},
          { id: 'p-104', name: 'Conor Lydon'},
        ]}
      />
      <CalendarView
        markedDates={getMarkedDates(filteredAppointments, selectedAppointments[0] || null)}
        onDayPress={handleDayPress}
      />
      <AppointmentModal
        visible={modalVisible}
        appointment={selectedAppointments[0] || null}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ClinicianCalendarScreen;