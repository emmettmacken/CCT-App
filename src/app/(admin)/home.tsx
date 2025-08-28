import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Card,
  Chip,
  Divider,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { supabase } from '../../../backend/supabaseClient';
import { formatISO } from 'date-fns';
import { TrialTemplate, Phase, Marker, Assessment, TrialMedication } from '../../types/admin';
import { styles } from "../../styles/adminHome.styles"

const generateId = (prefix = '') => `${prefix}${Math.random().toString(36).substring(2, 9)}`;

const categoryOptions = [
  'Clinical Exam',
  'Lab Test',
  'Imaging',
  'Medication',
  'Other',
];

const AdminTrialTemplateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Basic trial info
  const [name, setName] = useState('');
  const [protocolVersion, setProtocolVersion] = useState('');
  const [trialPhase, setTrialPhase] = useState('Induction');
  const [numberOfCycles, setNumberOfCycles] = useState<number>(4);
  const [cycleDurationDays, setCycleDurationDays] = useState<number>(42);
  const [followUpDurationDays, setFollowUpDurationDays] = useState<number | undefined>(100);
  const [notes, setNotes] = useState('');

  // configuration
  const [phases, setPhases] = useState<Phase[]>([
    { id: generateId('phase-'), name: 'Induction', startDay: 1, endDay: null },
  ]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [medications, setMedications] = useState<TrialMedication[]>([]);

  // local states for adding items
  const [phaseNameInput, setPhaseNameInput] = useState('');
  const [markerLabelInput, setMarkerLabelInput] = useState('');
  const [markerRefDayInput, setMarkerRefDayInput] = useState<string>(''); // numeric string or empty
  const [assessmentDraft, setAssessmentDraft] = useState<Partial<Assessment>>({});
  const [medDraft, setMedDraft] = useState<Partial<TrialMedication>>({});

  const [saving, setSaving] = useState(false);

  // derived: day tokens for cycle (d1 .. dN)
  const dayTokens = useMemo(() => {
    const arr: string[] = [];
    for (let i = 1; i <= cycleDurationDays; i += 1) {
      arr.push(`d${i}`);
    }
    return arr;
  }, [cycleDurationDays]);

  // helper to add phase
  const addPhase = () => {
    if (!phaseNameInput.trim()) {
      Alert.alert('Validation', 'Phase name cannot be empty');
      return;
    }
    const newPhase: Phase = { id: generateId('phase-'), name: phaseNameInput.trim() };
    setPhases((p) => [...p, newPhase]);
    setPhaseNameInput('');
  };

  const removePhase = (id: string) => {
    setPhases((p) => p.filter((x) => x.id !== id));
    // also remove references in assessments
    setAssessments((a) => a.map((ass) => ({ ...ass, applicablePhases: ass.applicablePhases.filter((ap) => ap !== id) })));
  };

  // markers
  const addMarker = () => {
    if (!markerLabelInput.trim()) {
      Alert.alert('Validation', 'Marker label required');
      return;
    }
    const refDay = markerRefDayInput ? parseInt(markerRefDayInput, 10) : undefined;
    const newMarker: Marker = { id: generateId('marker-'), label: markerLabelInput.trim(), referenceDay: refDay || null };
    setMarkers((m) => [...m, newMarker]);
    setMarkerLabelInput('');
    setMarkerRefDayInput('');
  };

  const removeMarker = (id: string) => {
    setMarkers((m) => m.filter((x) => x.id !== id));
    setAssessments((a) => a.map((ass) => ({ ...ass, scheduledDays: ass.scheduledDays.filter((s) => !s.startsWith(`marker:${id}`) ) })));
    setMedications((ms) => ms.map((md) => ({ ...md, administrationPattern: md.administrationPattern.filter((s) => !s.startsWith(`marker:${id}`) ) })));
  };

  // Day selector component (returns array of selected tokens)
  const DaySelector: React.FC<{
    value: string[] | undefined;
    onChange: (v: string[]) => void;
    allowMarkers?: boolean;
    compact?: boolean;
  }> = ({ value = [], onChange, allowMarkers = true, compact = false }) => {
    const toggle = (token: string) => {
      if (value.includes(token)) onChange(value.filter((t) => t !== token));
      else onChange([...value, token]);
    };

    return (
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {dayTokens.map((d) => {
            const selected = value.includes(d);
            return (
              <Chip
                key={d}
                mode={selected ? 'flat' : 'outlined'}
                selected={selected}
                onPress={() => toggle(d)}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
              >
                {d.replace('d', 'Day ')}
              </Chip>
            );
          })}
          {allowMarkers && markers.map((m) => {
            const token = `marker:${m.id}`;
            const selected = value.includes(token);
            return (
              <Chip
                key={token}
                mode={selected ? 'flat' : 'outlined'}
                selected={selected}
                onPress={() => toggle(token)}
                style={[styles.markerChip, selected && styles.markerChipSelected]}
              >
                {m.label}
              </Chip>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Assessments CRUD (local)
  const startAddAssessment = () => {
    setAssessmentDraft({
      id: generateId('ass-'),
      name: '',
      category: categoryOptions[0],
      applicablePhases: phases.map((p) => p.id), // default all
      scheduledDays: [],
      frequencyPattern: '',
      notes: '',
    });
  };

  const saveAssessmentDraft = () => {
    const draft = assessmentDraft as Assessment | undefined;
    if (!draft || !draft.name || !draft.category) {
      Alert.alert('Validation', 'Assessment must have a name and category');
      return;
    }
    if (assessments.some((a) => a.id === draft.id)) {
      // update
      setAssessments((prev) => prev.map((a) => (a.id === draft.id ? draft : a)));
    } else {
      setAssessments((prev) => [draft, ...prev]);
    }
    setAssessmentDraft({});
  };

  const removeAssessment = (id: string) => {
    setAssessments((a) => a.filter((x) => x.id !== id));
  };

  // Medications CRUD
  const startAddMedication = () => {
    setMedDraft({
      id: generateId('med-'),
      drugName: '',
      administrationPattern: [],
      cycleApplicability: 'all',
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

  const removeMedication = (id: string) => {
    setMedications((m) => m.filter((x) => x.id !== id));
  };

  // Save trial template to supabase
  const saveTemplate = async () => {
    if (!name.trim() || !protocolVersion.trim()) {
      Alert.alert('Validation', 'Trial name and protocol version are required.');
      return;
    }
    if (phases.length === 0) {
      Alert.alert('Validation', 'At least one phase is required.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const createdBy = user?.id ?? null;

      // create template
      const templatePayload: Partial<TrialTemplate> = {
        name: name.trim(),
        protocolVersion: protocolVersion.trim(),
        trialPhase,
        numberOfCycles,
        cycleDurationDays,
        followUpDurationDays: followUpDurationDays || undefined,
        notes: notes || undefined,
        version: 1,
        created_by: createdBy,
        created_at: formatISO(new Date()),
      };

      const { data: templateData, error: templateError } = await supabase
        .from('trial_templates')
        .insert([templatePayload])
        .select()
        .single();

      if (templateError) throw templateError;
      const templateId = templateData.id;

      // insert phases
      if (phases.length > 0) {
        const phasesPayload = phases.map((p) => ({
          trial_template_id: templateId,
          name: p.name,
          start_day: p.startDay || null,
          end_day: p.endDay || null,
        }));
        const { error: phasesError } = await supabase.from('trial_phases').insert(phasesPayload);
        if (phasesError) throw phasesError;
      }

      // insert markers
      if (markers.length > 0) {
        const markersPayload = markers.map((m) => ({
          trial_template_id: templateId,
          label: m.label,
          reference_day: m.referenceDay || null,
        }));
        const { error: markersError } = await supabase.from('trial_markers').insert(markersPayload);
        if (markersError) throw markersError;
      }

      // insert assessments
      if (assessments.length > 0) {
        // Map human tokens to stored format. We'll store scheduled_days as text[] on DB.
        const assPayload = assessments.map((a) => ({
          trial_template_id: templateId,
          name: a.name,
          category: a.category,
          applicable_phases: a.applicablePhases,
          scheduled_days: a.scheduledDays,
          frequency_pattern: a.frequencyPattern || null,
          notes: a.notes || null,
        }));
        const { error: assError } = await supabase.from('trial_assessments').insert(assPayload);
        if (assError) throw assError;
      }

      // insert medications
      if (medications.length > 0) {
        const medsPayload = medications.map((m) => ({
          trial_template_id: templateId,
          drug_name: m.drugName,
          administration_pattern: m.administrationPattern,
          cycle_applicability: m.cycleApplicability,
          special_conditions: m.specialConditions || null,
        }));
        const { error: medsError } = await supabase.from('trial_medications').insert(medsPayload);
        if (medsError) throw medsError;
      }

      Alert.alert('Success', 'Trial template created successfully.');
      // optionally reset form
      resetForm();
    } catch (err: any) {
      console.error('Failed to save template', err);
      Alert.alert('Error', 'Failed to save template. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setProtocolVersion('');
    setTrialPhase('Induction');
    setNumberOfCycles(4);
    setCycleDurationDays(42);
    setFollowUpDurationDays(100);
    setNotes('');
    setPhases([{ id: generateId('phase-'), name: 'Induction', startDay: 1 }]);
    setMarkers([]);
    setAssessments([]);
    setMedications([]);
  };

  useEffect(() => {
    // Keep assessmentDraft.applicablePhases updated if phases change
    if (assessmentDraft && Object.keys(assessmentDraft).length > 0) {
      setAssessmentDraft((d) => {
        const draft = d as Partial<Assessment>;
        if (!draft.applicablePhases || draft.applicablePhases.length === 0) {
          return { ...draft, applicablePhases: phases.map((p) => p.id) };
        }
        return draft;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create Trial Template</Text>

        {/* Basic Trial Information */}
        <Card style={styles.card}>
          <Card.Title title="Basic Trial Information" />
          <Card.Content>
            <TextInput label="Trial Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Protocol Version" value={protocolVersion} onChangeText={setProtocolVersion} mode="outlined" style={styles.input} />
            <TextInput label="Trial Phase (label)" value={trialPhase} onChangeText={setTrialPhase} mode="outlined" style={styles.input} />
            <View style={styles.row}>
              <TextInput
                label="Number of Cycles"
                value={String(numberOfCycles)}
                keyboardType="number-pad"
                onChangeText={(t) => setNumberOfCycles(Number(t) || 0)}
                mode="outlined"
                style={[styles.input, styles.half]}
              />
              <TextInput
                label="Cycle Duration (days)"
                value={String(cycleDurationDays)}
                keyboardType="number-pad"
                onChangeText={(t) => setCycleDurationDays(Number(t) || 0)}
                mode="outlined"
                style={[styles.input, styles.half]}
              />
            </View>
            <TextInput label="Follow-up Duration (days)" value={followUpDurationDays ? String(followUpDurationDays) : ''} keyboardType="number-pad" onChangeText={(t) => setFollowUpDurationDays(t ? Number(t) : undefined)} mode="outlined" style={styles.input} />
            <TextInput label="Custom Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline style={[styles.input, { minHeight: 80 }]} />
          </Card.Content>
        </Card>

        {/* Schedule Configuration */}
        <Card style={styles.card}>
          <Card.Title title="Schedule Configuration" subtitle="Phases, Cycle days and special markers" />
          <Card.Content>
            <Text style={styles.subhead}>Phases</Text>
            {phases.map((p) => (
              <View key={p.id} style={styles.itemRow}>
                <Text style={styles.itemText}>{p.name}</Text>
                <View style={styles.itemActions}>
                  <IconButton icon="delete" size={20} onPress={() => removePhase(p.id)} />
                </View>
              </View>
            ))}
            <View style={styles.row}>
              <TextInput placeholder="Phase name" value={phaseNameInput} onChangeText={setPhaseNameInput} mode="outlined" style={[styles.input, styles.flex]} />
              <Button mode="contained" onPress={addPhase} style={styles.addBtn}>Add</Button>
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <Text style={styles.subhead}>Special Markers (e.g., End of C2, Day 100 post-ASCT)</Text>
            {markers.map((m) => (
              <View key={m.id} style={styles.itemRow}>
                <Text style={styles.itemText}>{m.label}{m.referenceDay ? ` (Day ${m.referenceDay})` : ''}</Text>
                <IconButton icon="delete" size={20} onPress={() => removeMarker(m.id)} />
              </View>
            ))}

            <View style={styles.row}>
              <TextInput placeholder="Marker label" value={markerLabelInput} onChangeText={setMarkerLabelInput} mode="outlined" style={[styles.input, styles.flex]} />
              <TextInput placeholder="Reference day (optional)" value={markerRefDayInput} onChangeText={setMarkerRefDayInput} keyboardType="number-pad" style={[styles.input, styles.small]} mode="outlined" />
              <Button mode="contained" onPress={addMarker} style={styles.addBtn}>Add</Button>
            </View>
          </Card.Content>
        </Card>

        {/* Assessments / Evaluations */}
        <Card style={styles.card}>
          <Card.Title title="Assessments / Evaluations" />
          <Card.Content>
            <Button mode="outlined" onPress={startAddAssessment} style={{ marginBottom: 12 }}>New Assessment</Button>

            {assessmentDraft && Object.keys(assessmentDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput label="Assessment Name" value={assessmentDraft.name || ''} onChangeText={(t) => setAssessmentDraft((d) => ({ ...(d as Assessment), name: t }))} mode="outlined" style={styles.input} />
                <Text style={styles.label}>Category</Text>
                <RadioButton.Group onValueChange={(v) => setAssessmentDraft((d) => ({ ...(d as Assessment), category: v }))} value={assessmentDraft.category || categoryOptions[0]}>
                  <View style={styles.row}>
                    {categoryOptions.map((c) => (
                      <View key={c} style={styles.radioItem}>
                        <RadioButton value={c} />
                        <Text style={{ alignSelf: 'center' }}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>

                <Text style={styles.label}>Applicable Phases</Text>
                <View style={styles.chipsWrap}>
                  {phases.map((p) => {
                    const selected = (assessmentDraft.applicablePhases || []).includes(p.id);
                    return (
                      <Chip key={p.id} mode={selected ? 'flat' : 'outlined'} selected={selected} onPress={() => {
                        const aps = new Set(assessmentDraft.applicablePhases || []);
                        if (aps.has(p.id)) aps.delete(p.id); else aps.add(p.id);
                        setAssessmentDraft((d) => ({ ...(d as Assessment), applicablePhases: Array.from(aps) }));
                      }} style={styles.chipSmall}>
                        {p.name}
                      </Chip>
                    );
                  })}
                </View>

                <Text style={styles.label}>Scheduled Days / Markers</Text>
                <DaySelector value={assessmentDraft.scheduledDays} onChange={(v) => setAssessmentDraft((d) => ({ ...(d as Assessment), scheduledDays: v }))} allowMarkers />

                <TextInput label="Frequency Pattern (optional)" value={assessmentDraft.frequencyPattern || ''} onChangeText={(t) => setAssessmentDraft((d) => ({ ...(d as Assessment), frequencyPattern: t }))} mode="outlined" style={styles.input} />
                <TextInput label="Notes / Conditions (optional)" value={assessmentDraft.notes || ''} onChangeText={(t) => setAssessmentDraft((d) => ({ ...(d as Assessment), notes: t }))} mode="outlined" multiline style={[styles.input, { minHeight: 80 }]} />

                <View style={styles.row}>
                  <Button mode="outlined" onPress={() => setAssessmentDraft({})} style={styles.flex}>Cancel</Button>
                  <Button mode="contained" onPress={saveAssessmentDraft} style={[styles.flex, { marginLeft: 8 }]}>Save Assessment</Button>
                </View>
              </View>
            )}

            <Divider style={{ marginVertical: 12 }} />

            <Text style={styles.subhead}>Added Assessments</Text>
            {assessments.length === 0 ? <Text style={styles.noData}>No assessments added</Text> : assessments.map((a) => (
              <Card key={a.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemText}>{a.name} <Text style={styles.smallText}>({a.category})</Text></Text>
                    <View style={styles.itemActions}>
                      <IconButton icon="delete" size={20} onPress={() => removeAssessment(a.id)} />
                    </View>
                  </View>
                  <Text style={styles.smallText}>Phases: {a.applicablePhases.map((id) => phases.find((p) => p.id === id)?.name || id).join(', ')}</Text>
                  <Text style={styles.smallText}>Days: {a.scheduledDays.join(', ')}</Text>
                  {a.frequencyPattern ? <Text style={styles.smallText}>Freq: {a.frequencyPattern}</Text> : null}
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        {/* Medication Administration */}
        <Card style={styles.card}>
          <Card.Title title="Medication Administration" />
          <Card.Content>
            <Button mode="outlined" onPress={startAddMedication} style={{ marginBottom: 12 }}>New Drug Regimen</Button>

            {medDraft && Object.keys(medDraft).length > 0 && (
              <View style={styles.draftContainer}>
                <TextInput label="Drug Name" value={medDraft.drugName || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), drugName: t }))} mode="outlined" style={styles.input} />
                <Text style={styles.label}>Administration Pattern (select days/markers)</Text>
                <DaySelector value={medDraft.administrationPattern} onChange={(v) => setMedDraft((d) => ({ ...(d as TrialMedication), administrationPattern: v }))} allowMarkers />
                <TextInput label="Cycle Applicability (e.g., 1-2, all)" value={medDraft.cycleApplicability || 'all'} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), cycleApplicability: t }))} mode="outlined" style={styles.input} />
                <TextInput label="Special Conditions" value={medDraft.specialConditions || ''} onChangeText={(t) => setMedDraft((d) => ({ ...(d as TrialMedication), specialConditions: t }))} mode="outlined" style={styles.input} />
                <View style={styles.row}>
                  <Button mode="outlined" onPress={() => setMedDraft({})} style={styles.flex}>Cancel</Button>
                  <Button mode="contained" onPress={saveMedDraft} style={[styles.flex, { marginLeft: 8 }]}>Save Drug</Button>
                </View>
              </View>
            )}

            <Divider style={{ marginVertical: 12 }} />
            <Text style={styles.subhead}>Drug Regimens</Text>
            {medications.length === 0 ? <Text style={styles.noData}>No drug regimens added</Text> : medications.map((m) => (
              <Card key={m.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemText}>{m.drugName}</Text>
                    <IconButton icon="delete" size={20} onPress={() => removeMedication(m.id)} />
                  </View>
                  <Text style={styles.smallText}>Pattern: {m.administrationPattern.join(', ')}</Text>
                  <Text style={styles.smallText}>Cycles: {m.cycleApplicability}</Text>
                  {m.specialConditions ? <Text style={styles.smallText}>Conditions: {m.specialConditions}</Text> : null}
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        {/* Metadata + Save */}
        <Card style={styles.card}>
          <Card.Title title="Metadata & Versioning" />
          <Card.Content>
            <Text style={styles.smallText}>Templates are versioned on creation. Updating an existing template should create a new version (not implemented in this screen).</Text>
            <View style={styles.row}>
              <Button mode="outlined" onPress={resetForm} style={[styles.flex]}>Reset</Button>
              <Button mode="contained" onPress={saveTemplate} loading={saving} style={[styles.flex, { marginLeft: 8 }]}>Save Template</Button>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTrialTemplateScreen;