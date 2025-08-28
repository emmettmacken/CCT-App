import React, { useState, useEffect } from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../backend/supabaseClient';
import { styles } from '../../styles/clinicianHome.styles';

import AppointmentsSection from '../../components/ui/AppointmentsSection';
import QuickLinksSection from '../../components/ui/QuickLinksSection';

import { Appointment } from '../../types/clinician';

const ClinicianHomeScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select(`
            id,
            user_id,
            title,
            date,
            time,
            location,
            requirements,
            profiles ( name )
          `)
          .gte('date', todayStart.toISOString())
          .lte('date', todayEnd.toISOString())
          .order('time', { ascending: true });

        if (error) throw error;

        const formattedAppointments: Appointment[] =
          appointmentsData?.map(appt => ({
            ...appt,
            patient_name: appt.profiles?.name || 'Unknown Patient',
          })) || [];

        setAppointments(formattedAppointments);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <AppointmentsSection appointments={appointments} />
        <QuickLinksSection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClinicianHomeScreen;