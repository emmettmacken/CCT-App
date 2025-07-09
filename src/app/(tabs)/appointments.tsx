import React, { useState, useEffect } from 'react';
import { Text, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../../backend/supabaseClient';
import { styles } from '../../styles/appointments.styles';
import { Appointment, AppointmentData } from '../../types/appointments';
import AppointmentModal from '../../components/AppointmentModal';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

const CalendarScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Record<string, AppointmentData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);

        if (!user) {
          setAppointments({});
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)
          .gte('date', today.toISOString())
          .lte('date', nextYear.toISOString())
          .order('date', { ascending: true });

        if (error) throw error;

        const formattedAppointments: Record<string, AppointmentData> = {};
        data.forEach((appointment: any) => {
          const date = format(new Date(appointment.date), 'yyyy-MM-dd');
          formattedAppointments[date] = {
            marked: true,
            dotColor: '#3f51b5',
            selected: selectedDate === date,
            selectedColor: '#3f51b5',
            appointmentData: appointment
          };
        });

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAppointments();
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
      <Text style={styles.attendance}>If you cannot attend your scheduled appointment, please contact Clinical Trials Office at 087 382 4221 at your earliest convenience</Text>
      <Calendar
        current={new Date().toISOString()}
        minDate={new Date().toISOString()}
        maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()}
        markedDates={appointments}
        onDayPress={handleDayPress}
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