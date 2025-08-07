import React from 'react';
import { View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../../styles/clinicianCalendar';
import { Patient } from '../../types/clinCalendar';

type Props = {
  selectedPatient: string;
  setSelectedPatient: (id: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  viewMode: 'month' | 'week';
  setViewMode: (mode: 'month' | 'week') => void;
  patients: Patient[];
};

const FilterBar = ({
  selectedPatient,
  setSelectedPatient,
  selectedType,
  setSelectedType,
  viewMode,
  setViewMode,
  patients
}: Props) => (
  <View style={styles.filterContainer}>
    {/* Patient Picker */}
    <TextInput
      label="Patient"
      value={selectedPatient}
      style={styles.filterInput}
      mode="outlined"
      render={() => (
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedPatient} onValueChange={setSelectedPatient} style={styles.picker}>
            <Picker.Item label="All Patients" value="all" />
            {patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>
      )}
    />
    {/* Type Picker */}
    <TextInput
      label="Appointment Type"
      value={selectedType}
      style={styles.filterInput}
      mode="outlined"
      render={() => (
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedType} onValueChange={setSelectedType} style={styles.picker}>
            <Picker.Item label="All Types" value="all" />
            <Picker.Item label="Checkup" value="checkup" />
            <Picker.Item label="Treatment" value="treatment" />
            <Picker.Item label="Consultation" value="consultation" />
          </Picker>
        </View>
      )}
    />
    {/* View Mode Toggle */}
    <View style={styles.viewToggle}>
      <Button mode={viewMode === 'month' ? 'contained' : 'outlined'} onPress={() => setViewMode('month')} style={styles.toggleButton}>Month</Button>
      <Button mode={viewMode === 'week' ? 'contained' : 'outlined'} onPress={() => setViewMode('week')} style={styles.toggleButton}>Week</Button>
    </View>
  </View>
);

export default FilterBar;