// TrialMedicationsSection.tsx
import { format, parseISO } from "date-fns";
import React from "react";
import { Text, View } from "react-native";
import { Button, Card, List, RadioButton } from "react-native-paper";
import { styles } from "../../styles/medications.styles";
import { Medication, MedicationLog } from "../../types/medications";

interface Props {
  trialMedications: Medication[];
  medicationLogs: MedicationLog[];
  selectedTrialMed: Medication | null;
  setSelectedTrialMed: (med: Medication) => void;
  onLogPress: () => void;
}

export const TrialMedicationsSection: React.FC<Props> = ({
  trialMedications,
  medicationLogs,
  selectedTrialMed,
  setSelectedTrialMed,
  onLogPress,
}) => {
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Unknown time";
    return format(parseISO(dateString), "MMM d, yyyy - h:mm a");
  };

  return (
    <Card style={styles.sectionCard}>
      <Card.Title
        title="Trial Medications"
        subtitle="Log your prescribed trial medications"
        titleStyle={styles.sectionTitle}
      />
      <Card.Content>
        {trialMedications.length > 0 ? (
          <>
            <Text style={styles.subtitle}>Select medication to log:</Text>
            <View style={styles.radioGroup}>
              {trialMedications.map((med) => (
                <View key={med.id} style={styles.radioItem}>
                  <RadioButton
                    value={med.id}
                    status={
                      selectedTrialMed?.id === med.id ? "checked" : "unchecked"
                    }
                    onPress={() => setSelectedTrialMed(med)}
                  />
                  <Text style={{ flexWrap: "wrap" }}>
                    <Text style={styles.radioLabel}>
                      {med.name} ({med.dosage}) -
                    </Text>
                    <Text>
                      <Text style={styles.radioLabel}> Frequency: </Text>
                       <Text style={styles.radioValue}>{med.frequency || "Consult your clinician"}
                      </Text>
                      {"\n"}
                      <Text style={styles.radioLabel}>Clinician Notes: </Text>
                      <Text style={styles.radioValue}>{med.notes || "No notes given"}</Text>
                    </Text>
                  </Text>
                </View>
              ))}
            </View>

            {selectedTrialMed && (
              <Button
                mode="contained"
                onPress={onLogPress}
                style={styles.logButton}
              >
                Log Dose Taken
              </Button>
            )}

            <Text style={styles.subtitle}>Recently logged:</Text>
            {medicationLogs.length > 0 ? (
              <List.Section>
                {medicationLogs.map((log) => {
                  const med = trialMedications.find(
                    (m) => m.id === log.medication_id
                  );
                  return (
                    <List.Item
                      key={log.id}
                      title={`${med?.name || "Unknown"} (${log.dosage})`}
                      description={`Taken at: ${formatDateTime(log.taken_at)}`}
                      left={() => <List.Icon icon="pill" />}
                    />
                  );
                })}
              </List.Section>
            ) : (
              <Text style={styles.noItemsText}>
                No trial medications logged yet
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noItemsText}>No trial medications assigned</Text>
        )}
      </Card.Content>
    </Card>
  );
};
