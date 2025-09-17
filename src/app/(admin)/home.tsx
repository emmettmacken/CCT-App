import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Card,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { supabase } from '../../../backend/supabaseClient';
import { formatISO } from 'date-fns';
import { Assessment, TrialMedication } from '../../types/admin';
import { styles } from "../../styles/adminHome.styles";

const categoryOptions = [
  'Clinical Exam',
  'Lab Test',
  'Imaging',
  'Medication',
  'Other',
];

const generateId = (prefix = '') => `${prefix}${Math.random().toString(36).substring(2, 9)}`;

const AdminTrialTemplateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Basic trial info
  const [name, setName] = useState('');
  const [protocolVersion, setProtocolVersion] = useState('');
  const [numberOfCycles, setNumberOfCycles] = useState<string>('4');
  const [cycleDurationDays, setCycleDurationDays] = useState<string>('42');
  const [notes, setNotes] = useState('');

  // Assessments & Medications
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [medications, setMedications] = useState<TrialMedication[]>([]);

  // Drafts
  const [assessmentDraft, setAssessmentDraft] = useState<Partial<Assessment>>({});
  const [medDraft, setMedDraft] = useState<Partial<TrialMedication>>({});

  const [saving, setSaving] = useState(false);

  // Day tokens for Induction cycle
  const dayTokens = useMemo(() => {
    const days = parseInt(cycleDurationDays, 10) || 0;
    return Array.from({ length: days }, (_, i) => `d${i + 1}`);
  }, [cycleDurationDays]);

  // Cycle options for dropdowns
  const cycleOptions = useMemo(() => {
    const n = parseInt(numberOfCycles, 10) || 0;
    return Array.from({ length: n }, (_, i) => (i + 1).toString());
  }, [numberOfCycles]);

  // Multi-select dropdown state for days
  const [openDayDropdown, setOpenDayDropdown] = useState(false);
  const dayItems = useMemo(() => dayTokens.map((d) => ({ label: `Day ${d.replace('d', '')}`, value: d })), [dayTokens]);

  // Assessment CRUD
  const startAddAssessment = () => {
    setAssessmentDraft({
      id: generateId('ass-'),
      name: '',
      category: categoryOptions[0],
      scheduledDays: [],
      applicableCycles: [],
      requirements: '',
    });
  };

  const saveAssessmentDraft = () => {
    const draft = assessmentDraft as Assessment | undefined;
    if (!draft || !draft.name || !draft.category) {
      Alert.alert('Validation', 'Assessment must have a name and category');
      return;
    }
    if (assessments.some((a) => a.id === draft.id)) {
      setAssessments((prev) => prev.map((a) => (a.id === draft.id ? draft : a)));
    } else {
      setAssessments((prev) => [draft, ...prev]);
    }
    setAssessmentDraft({});
  };

  const removeAssessment = (id: string) => setAssessments((a) => a.filter((x) => x.id !== id));

  // Medication CRUD
  const startAddMedication = () => {
    setMedDraft({
      id: generateId('med-'),
      drugName: '',
      dosage: '',
      frequency: '',
      administrationPattern: [],
      applicableCycles: [],
      specialConditions: '',
    });
  };

  const saveMedDraft = () => {
    const draft = medDraft as TrialMedication | undefined;
    if (!draft || !draft.drugName) {
      Alert.alert('Validation', 'Drug name required');
      return;
    }
    if (medications.some((m) => m.id === draft.id)) {
      setMedications((prev) => prev.map((m) => (m.id === draft.id ? draft : m)));
    } else {
      setMedications((prev) => [draft, ...prev]);
    }
    setMedDraft({});
  };

  const removeMedication = (id: string) => setMedications((m) => m.filter((x) => x.id !== id));

  // Reset form
  const resetForm = () => {
    setName('');
    setProtocolVersion('');
    setNumberOfCycles('4');
    setCycleDurationDays('42');
    setNotes('');
    setAssessments([]);
    setMedications([]);
    setAssessmentDraft({});
    setMedDraft({});
  };

  // Save template to Supabase
  const saveTemplate = async () => {
    if (!name.trim() || !protocolVersion.trim()) {
      Alert.alert('Validation', 'Trial name and protocol version are required.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id ?? null;

      const numCycles = parseInt(numberOfCycles, 10) || 0;
      const cycleDays = parseInt(cycleDurationDays, 10) || 0;

      // Insert trial
      const { data: trialData, error: trialError } = await supabase
        .from('trials')
        .insert([{
          name: name.trim(),
          protocol_version: protocolVersion.trim(),
          trial_phase: 'Induction',
          number_of_cycles: numCycles,
          cycle_duration_days: cycleDays,
          notes: notes?.trim() || null,
          created_by: createdBy,
          created_at: formatISO(new Date()),
        }])
        .select()
        .single();

      if (trialError) throw trialError;
      const trialId = trialData.id;

      // Insert assessments
      if (assessments.length > 0) {
        const assPayload = assessments.map((a) => ({
          trial_id: trialId,
          name: a.name,
          category: a.category,
          scheduled_days: a.scheduledDays.map((d) => parseInt(d.replace('d', ''), 10)),
          applicable_cycles: a.applicableCycles,
          requirements: a.requirements || null,
        }));
        const { error: assError } = await supabase.from('trial_assessments').insert(assPayload);
        if (assError) throw assError;
      }

      // Insert medications
      if (medications.length > 0) {
        const medsPayload = medications.map((m) => ({
          trial_id: trialId,
          drug_name: m.drugName,
          dosage: m.dosage || null,
          frequency: m.frequency || null,
          administration_pattern: m.administrationPattern,
          applicable_cycles: m.applicableCycles,
          special_conditions: m.specialConditions || null,
        }));
        const { error: medsError } = await supabase.from('trial_medications_template').insert(medsPayload);
        if (medsError) throw medsError;
      }

      Alert.alert('Success', 'Trial template created successfully.');
      resetForm();
    } catch (err: any) {
      console.error('Failed to save template', err);
      Alert.alert('Error', 'Failed to save template. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create Trial Template</Text>

        {/* Basic Trial Info */}
        <Card style={styles.card}>
          <Card.Title title="Basic Trial Information" />
          <Card.Content>
            <TextInput label="Trial Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Protocol Version" value={protocolVersion} onChangeText={setProtocolVersion} mode="outlined" style={styles.input} />
            <TextInput
              label="Number of Cycles"
              value={numberOfCycles}
              keyboardType="number-pad"
              onChangeText={setNumberOfCycles}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Cycle Duration (days)"
              value={cycleDurationDays}
              keyboardType="number-pad"
              onChangeText={setCycleDurationDays}
              mode="outlined"
              style={styles.input}
            />
            <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} mode="outlined" multiline style={[styles.input, { minHeight: 80 }]} />
          </Card.Content>
        </Card>

        {/* Assessments */}
        <Card style={styles.card}>
          <Card.Title title="Assessments / Evaluations" />
          <Card.Content>
            <Button mode="outlined" onPress={startAddAssessment} style={{ marginBottom: 12 }}>New Assessment</Button>
            {assessmentDraft && Object.keys(assessmentDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput label="Assessment Name" value={assessmentDraft.name || ''} onChangeText={(t) => setAssessmentDraft((d) => ({ ...(d as Assessment), name: t }))} mode="outlined" style={styles.input} />
                <Text style={styles.label}>Category</Text>
                <RadioButton.Group onValueChange={(v) => setAssessmentDraft((d) => ({ ...(d as Assessment), category: v }))} value={assessmentDraft.category || categoryOptions[0]}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {categoryOptions.map((c) => (
                      <View key={c} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <RadioButton value={c} />
                        <Text>{c}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>

                <Text style={styles.label}>Scheduled Days</Text>
                <DropDownPicker
                  multiple={true}
                  open={openDayDropdown}
                  value={assessmentDraft.scheduledDays}
                  items={dayItems}
                  setOpen={setOpenDayDropdown}
                  setValue={(callback) => setAssessmentDraft((d) => ({ ...(d as Assessment), scheduledDays: callback(d?.scheduledDays || []) }))}
                  placeholder="Select Scheduled Days"
                  mode="BADGE"
                  style={{ marginBottom: 8 }}
                />

                <Text style={styles.label}>Applicable Cycles</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {cycleOptions.map((c) => {
                    const selected = (assessmentDraft.applicableCycles || []).includes(c);
                    return (
                      <Button
                        key={c}
                        mode={selected ? 'contained' : 'outlined'}
                        onPress={() => {
                          const aps = new Set(assessmentDraft.applicableCycles || []);
                          if (aps.has(c)) aps.delete(c); else aps.add(c);
                          setAssessmentDraft((d) => ({ ...(d as Assessment), applicableCycles: Array.from(aps) }));
                        }}
                        style={{ marginRight: 4, marginBottom: 4 }}
                      >
                        {c}
                      </Button>
                    );
                  })}
                </View>

                <TextInput label="Requirements?" value={assessmentDraft.requirements || ''} onChangeText={(t) => setAssessmentDraft((d) => ({ ...(d as Assessment), requirements: t }))} mode="outlined" multiline style={[styles.input, { minHeight: 80 }]} />

                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button mode="outlined" onPress={() => setAssessmentDraft({})} style={{ flex: 1 }}>Cancel</Button>
                  <Button mode="contained" onPress={saveAssessmentDraft} style={{ flex: 1, marginLeft: 8 }}>Save Assessment</Button>
                </View>
              </View>
            )}

            {assessments.length > 0 ? assessments.map((a) => (
              <Card key={a.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{a.name} ({a.category})</Text>
                    <IconButton icon="delete" size={20} onPress={() => removeAssessment(a.id)} />
                  </View>
                  <Text>Days: {a.scheduledDays.join(', ')}</Text>
                  {a.applicableCycles && <Text>Cycles: {a.applicableCycles.join(', ')}</Text>}
                  {a.requirements && <Text>Requirements: {a.requirements}</Text>}
                </Card.Content>
              </Card>
            )) : <Text>No assessments added</Text>}
          </Card.Content>
        </Card>

        {/* Medications */}
        <Card style={styles.card}>
          <Card.Title title="Medication Administration" />
          <Card.Content>
            <Button mode="outlined" onPress={startAddMedication} style={{ marginBottom: 12 }}>New Drug Regimen</Button>
            {medDraft && Object.keys(medDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput label="Drug Name" value={medDraft.drugName || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), drugName: t }))} mode="outlined" style={styles.input} />
                <TextInput label="Dosage" value={medDraft.dosage || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), dosage: t }))} mode="outlined" style={styles.input} />
                <TextInput label="Frequency" value={medDraft.frequency || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), frequency: t }))} mode="outlined" style={styles.input} />

                <Text style={styles.label}>Administration Pattern</Text>
                <DropDownPicker
                  multiple={true}
                  open={openDayDropdown}
                  value={medDraft.administrationPattern || []}
                  items={dayItems}
                  setOpen={setOpenDayDropdown}
                  setValue={(callback) => setMedDraft((d) => ({ ...(d as TrialMedication), administrationPattern: callback(d?.administrationPattern || []) }))}
                  placeholder="Select Administration Days"
                  mode="BADGE"
                  style={{ marginBottom: 8 }}
                />

                <Text style={styles.label}>Applicable Cycles</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {cycleOptions.map((c) => {
                    const selected = (medDraft.applicableCycles || []).includes(c);
                    return (
                      <Button
                        key={c}
                        mode={selected ? 'contained' : 'outlined'}
                        onPress={() => {
                          const aps = new Set(medDraft.applicableCycles || []);
                          if (aps.has(c)) aps.delete(c); else aps.add(c);
                          setMedDraft((d) => ({ ...(d as TrialMedication), applicableCycles: Array.from(aps) }));
                        }}
                        style={{ marginRight: 4, marginBottom: 4 }}
                      >
                        {c}
                      </Button>
                    );
                  })}
                </View>

                <TextInput label="Special Conditions" value={medDraft.specialConditions || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), specialConditions: t || null }))} mode="outlined" style={styles.input} />

                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button mode="outlined" onPress={() => setMedDraft({})} style={{ flex: 1 }}>Cancel</Button>
                  <Button mode="contained" onPress={saveMedDraft} style={{ flex: 1, marginLeft: 8 }}>Save Drug</Button>
                </View>
              </View>
            )}

            {medications.length > 0 ? medications.map((m) => (
              <Card key={m.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{m.drugName}</Text>
                    <IconButton icon="delete" size={20} onPress={() => removeMedication(m.id)} />
                  </View>
                  {m.dosage && <Text>Dosage: {m.dosage}</Text>}
                  {m.frequency && <Text>Frequency: {m.frequency}</Text>}
                  <Text>Pattern: {m.administrationPattern.join(', ')}</Text>
                  {m.applicableCycles && <Text>Cycles: {m.applicableCycles.join(', ')}</Text>}
                  {m.specialConditions && <Text>Conditions: {m.specialConditions}</Text>}
                </Card.Content>
              </Card>
            )) : <Text>No drug regimens added</Text>}
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={saveTemplate} loading={saving} style={{ marginVertical: 12 }}>Save Template</Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTrialTemplateScreen;