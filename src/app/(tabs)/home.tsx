import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { styles } from "../../styles/home.styles";

// Mock data for user and appointments
// In a real app, this would be fetched from an API or state management store
const MOCK_USER = {
  name: 'Emmett Macken',
  trialProgress: 65, // percentage
  trialName: 'ISA-RVD Trial',
  trialPhase: 'Cycle 1',
};

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    date: '15 July 2025',
    time: '09:30 AM',
    title: 'Blood Test & Consultation',
    location: 'Oncology Dept, Floor 3',
    requirements: ['8-hour fasting', 'Bring medication list'],
  },
  {
    id: '2',
    date: '22 July 2025',
    time: '11:00 AM',
    title: 'CT Scan',
    location: 'Radiology Dept, Floor 2',
    requirements: ['No metal objects', 'Wear comfortable clothing'],
  },
  {
    id: '3',
    date: '29 July 2025',
    time: '10:15 AM',
    title: 'Treatment Administration',
    location: 'Treatment Room 5, Floor 4',
    requirements: ['Take anti-nausea medication 1hr before', 'Arrange transport home'],
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Trial Progress</Text>
          <Text style={styles.progressPercent}>{MOCK_USER.trialProgress}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${MOCK_USER.trialProgress}%` }]} />
        </View>
        <Text style={styles.trialInfo}>
          {MOCK_USER.trialName} • {MOCK_USER.trialPhase}
        </Text>
      </View>
    );
  };

  interface Appointment {
    id: string;
    date: string;
    time: string;
    title: string;
    location: string;
    requirements: string[];
  }

  const renderAppointmentCard = (appointment: Appointment) => {
    return (
      <TouchableOpacity 
        key={appointment.id} 
        style={styles.appointmentCard}
        onPress={() => {
        }}
      >
        <View style={styles.appointmentDateContainer}>
          <Text style={styles.appointmentDate}>{appointment.date}</Text>
          <Text style={styles.appointmentTime}>{appointment.time}</Text>
        </View>
        <View style={styles.appointmentDivider} />
        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentTitle}>{appointment.title}</Text>
          <Text style={styles.appointmentLocation}>{appointment.location}</Text>
          {appointment.requirements.map((req: string, index: number) => (
            <Text key={index} style={styles.appointmentRequirement}>• {req}</Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{MOCK_USER.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => {
              router.push('/profile'); // Navigate to profile screen
            }}
          >
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>{MOCK_USER.name[0]}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {renderProgressBar()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity 
            onPress={() => {
              // Navigate to full calendar when implemented
              // navigation.navigate('calendar');
            }}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentsContainer}>
          {MOCK_APPOINTMENTS.map(renderAppointmentCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}