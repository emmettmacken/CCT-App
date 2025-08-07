import React, { useState, useEffect } from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../backend/supabaseClient';
import { styles } from '../../styles/clinicianhome.styles';

import AlertsSection from '../../components/ui/AlertsSection';
import AppointmentsSection from '../../components/ui/AppointmentsSection';
import QuickLinksSection from '../../components/ui/QuickLinksSection';

import { Appointment, Alert } from '../../types/clinician';

const ClinicianHomeScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`id, patient_id, patients:patient_id(name), date, time, type, status, notes`)
          .gte('date', todayStart.toISOString())
          .lte('date', todayEnd.toISOString())
          .order('time', { ascending: true });

        const formattedAppointments = appointmentsData?.map(appt => ({
          ...appt,
          patient_name: appt.patients?.[0]?.name || 'Unknown Patient',
        })) || [];

        setAppointments(formattedAppointments);

        const { data: alertsData } = await supabase
          .from('alerts')
          .select('*')
          .eq('clinician_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        setAlerts(alertsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const subscription = supabase
      .channel('clinician-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
        setAlerts(prev => [payload.new as Alert, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await supabase.from('alerts').update({ read: true }).eq('id', alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'patient_message': return 'message-text';
      case 'medication_alert': return 'alert-circle';
      case 'appointment_change': return 'calendar-alert';
      default: return 'alert';
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'medication_alert': return '#d32f2f';
      case 'appointment_change': return '#ff9800';
      default: return '#3f51b5';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AlertsSection
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          getAlertIcon={getAlertIcon}
          getAlertColor={getAlertColor}
        />
        <AppointmentsSection appointments={appointments} />
        <QuickLinksSection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClinicianHomeScreen;