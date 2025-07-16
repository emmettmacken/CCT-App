import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Link, router } from 'expo-router';
import { styles } from "../../styles/home.styles";

// Mock data for user and appointments
// In the real app, this would be fetched from an API or state management store
const MOCK_USER = {
  name: 'Emmett Macken',
  trialProgress: 65, // percentage
  trialName: 'ISA-RVD Trial',
  trialPhase: 'Cycle 1',
};

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    date: '22 July 2025',
    time: '15:00 PM',
    title: 'Follow-up',
    location: 'Clinic A, Floor 2',
    requirements: ['No fasting required', 'Bring your medical records and any current medications'],
  },
  {
    id: '2',
    date: '25 July 2025',
    time: '11:00 AM',
    title: 'Treatment Administration',
    location: 'Treatment Room 5, Floor 4',
    requirements: ['Fasting required','Take anti-nausea medication 1hr before', 'Arrange transport home'],
  },
  {
    id: '3',
    date: '28 July 2025',
    time: '09:00 AM',
    title: 'CT Scan',
    location: 'Radiology Dept, Floor 2',
    requirements: ['No metal objects', 'Wear comfortable clothing'],
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
            <Link href= "/(tabs)/appointments" style={styles.seeAllText}>
              See All
            </Link>
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentsContainer}>
          {MOCK_APPOINTMENTS.map(renderAppointmentCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}