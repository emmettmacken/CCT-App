import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { List, Card, TextInput, Button, Chip, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../backend/supabaseClient';
import { format, parseISO } from 'date-fns';
import { styles } from '../../styles/patients.styles'
import { Patient, Appointment, Medication, ClinicianNote, Alert } from '../../types/patients';

const PatientListScreen = ({ navigation }: { navigation: any }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('patient_clinician')
          .select(`
            patient:patient_id(id, name, age, diagnosis, last_appointment),
            alerts:alerts(count)
          `)
          .eq('clinician_id', user.id);

        if (error) throw error;

        const formattedPatients = data?.map(item => ({
          id: item.patient[0]?.id,
          name: item.patient[0]?.name,
          age: item.patient[0]?.age,
          diagnosis: item.patient[0]?.diagnosis,
          last_appointment: item.patient[0]?.last_appointment,
          alerts: item.alerts[0]?.count || 0
        })) || [];

        setPatients(formattedPatients);
        setFilteredPatients(formattedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();

    const subscription = supabase
      .channel('patient-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_clinician' },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let result = [...patients];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply diagnosis filter
    if (diagnosisFilter !== 'all') {
      result = result.filter(p => 
        p.diagnosis.toLowerCase().includes(diagnosisFilter.toLowerCase())
      );
    }
    
    setFilteredPatients(result);
  }, [searchQuery, diagnosisFilter, patients]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading patients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.filterContainer}>
        <TextInput
          label="Search patients"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
        />
        
        <View style={styles.chipContainer}>
          <Chip
            selected={diagnosisFilter === 'all'}
            onPress={() => setDiagnosisFilter('all')}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={diagnosisFilter === 'ISA'}
            onPress={() => setDiagnosisFilter('ISA')}
            style={styles.chip}
          >
            ISA
          </Chip>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredPatients.length > 0 ? (
          <List.Section>
            {filteredPatients.map(patient => (
              <List.Item
                key={patient.id}
                title={patient.name}
                description={`${patient.age} years | ${patient.diagnosis}`}
                left={() => (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {patient.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                right={() => (
                  <View style={styles.rightContent}>
                    <Text style={styles.dateText}>
                      {format(parseISO(patient.last_appointment), 'MMM d')}
                    </Text>
                    {patient.alerts > 0 && (
                      <Badge size={24} style={styles.badge}>
                        {patient.alerts}
                      </Badge>
                    )}
                  </View>
                )}
                style={styles.listItem}
                onPress={() => navigation.navigate('PatientProfile', { patientId: patient.id })}
              />
            ))}
          </List.Section>
        ) : (
          <Text style={styles.noPatientsText}>No patients found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const PatientProfileScreen = ({ route }: { route: { params: { patientId: string } } }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState<ClinicianNote[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(true);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [editMedData, setEditMedData] = useState<Partial<Medication>>({});
  const [showMedModal, setShowMedModal] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (patientError) throw patientError;

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('date', { ascending: false });

        if (appointmentsError) throw appointmentsError;

        // Fetch medications
        const { data: medicationsData, error: medicationsError } = await supabase
          .from('medications')
          .select('*')
          .eq('patient_id', patientId)
          .order('start_date', { ascending: false });

        if (medicationsError) throw medicationsError;

        // Fetch clinician notes
        const { data: notesData, error: notesError } = await supabase
          .from('clinician_notes')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        // Fetch alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('patient_alerts')
          .select('*')
          .eq('patient_id', patientId)
          .eq('active', true);

        if (alertsError) throw alertsError;

        setPatient(patientData);
        setAppointments(appointmentsData || []);
        setMedications(medicationsData || []);
        setNotes(notesData || []);
        setAlerts(alertsData || []);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();

    const subscription = supabase
      .channel('patient-profile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchPatientData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medications' },
        () => fetchPatientData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinician_notes' },
        () => fetchPatientData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_alerts' },
        () => fetchPatientData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [patientId]);

  const handleUpdateMedication = async () => {
    if (!editMedId) return;

    try {
      await supabase
        .from('medications')
        .update(editMedData)
        .eq('id', editMedId);

      setShowMedModal(false);
      setEditMedId(null);
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  if (loading || !patient) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading patient data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.profileContainer}>
        {/* Patient Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {patient.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{patient.name}</Text>
          <Text style={styles.profileDetails}>
            {patient.age} years | {patient.diagnosis}
          </Text>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card style={styles.alertCard}>
            <Card.Title title="Alerts" titleStyle={styles.cardTitle} />
            <Card.Content>
              {alerts.map(alert => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={[
                    styles.alertIcon,
                    alert.type === 'fasting' && styles.fastingAlert,
                    alert.type === 'allergy' && styles.allergyAlert,
                    alert.type === 'precaution' && styles.precautionAlert,
                  ]}>
                    <Text style={styles.alertIconText}>
                      {alert.type === 'fasting' ? 'F' : alert.type === 'allergy' ? 'A' : 'P'}
                    </Text>
                  </View>
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'appointments' && styles.activeTab
            ]}
            onPress={() => setActiveTab('appointments')}
          >
            <Text style={styles.tabText}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'medications' && styles.activeTab
            ]}
            onPress={() => setActiveTab('medications')}
          >
            <Text style={styles.tabText}>Medications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'notes' && styles.activeTab
            ]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={styles.tabText}>Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {appointments.length > 0 ? (
                <List.Section>
                  {appointments.map(appt => (
                    <List.Item
                      key={appt.id}
                      title={format(parseISO(appt.date), 'PPPPp')}
                      description={`${appt.type} - ${appt.status}`}
                      left={() => (
                        <View style={[
                          styles.statusIndicator,
                          appt.status === 'completed' && styles.completedStatus,
                          appt.status === 'missed' && styles.missedStatus,
                          appt.status === 'upcoming' && styles.upcomingStatus,
                        ]} />
                      )}
                      right={() => appt.notes && (
                        <List.Icon icon="note-text" color="#666" />
                      )}
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No appointments found</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {medications.length > 0 ? (
                <List.Section>
                  {medications.map(med => (
                    <List.Item
                      key={med.id}
                      title={med.name}
                      description={`${med.dosage} - ${med.frequency}`}
                      left={() => <List.Icon icon="pill" />}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={() => {
                            setEditMedId(med.id);
                            setEditMedData({
                              dosage: med.dosage,
                              frequency: med.frequency,
                              notes: med.notes
                            });
                            setShowMedModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No medications found</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <Card style={styles.contentCard}>
            <Card.Content>
              {notes.length > 0 ? (
                <List.Section>
                  {notes.map(note => (
                    <List.Item
                      key={note.id}
                      title={note.author}
                      description={`${format(parseISO(note.created_at), 'PP')}\n${note.content}`}
                      left={() => <List.Icon icon="note" />}
                      style={styles.listItem}
                    />
                  ))}
                </List.Section>
              ) : (
                <Text style={styles.noDataText}>No notes found</Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Medication Edit Modal */}
      <Modal
        visible={showMedModal}
        onRequestClose={() => setShowMedModal(false)}
        animationType="slide"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Medication</Text>
            
            <TextInput
              label="Dosage"
              value={editMedData.dosage || ''}
              onChangeText={text => setEditMedData({...editMedData, dosage: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Frequency"
              value={editMedData.frequency || ''}
              onChangeText={text => setEditMedData({...editMedData, frequency: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Notes"
              value={editMedData.notes || ''}
              onChangeText={text => setEditMedData({...editMedData, notes: text})}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonRow}>
              <Button 
                mode="outlined" 
                onPress={() => setShowMedModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpdateMedication}
                style={styles.submitButton}
                disabled={!editMedData.dosage || !editMedData.frequency}
              >
                Save Changes
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export { PatientListScreen as default, PatientProfileScreen };