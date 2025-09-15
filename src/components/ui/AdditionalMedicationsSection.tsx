import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Card, Button, List, IconButton } from 'react-native-paper';
import { AdditionalMedication, MedicationLog } from '../../types/medications';
import { format, parseISO } from 'date-fns';
import { styles } from '../../styles/medications.styles';

interface Props {
  additionalMeds: AdditionalMedication[];
  medicationLogs: MedicationLog[];
  onAddPress: (medToEdit?: AdditionalMedication) => void; // reuse add form for editing
}

export const AdditionalMedicationsSection: React.FC<Props> = ({ additionalMeds, onAddPress }) => {
  const [editingMed, setEditingMed] = useState<AdditionalMedication | null>(null);

  const formatDateTime = (dateString: string) => format(parseISO(dateString), 'MMM d, yyyy - h:mm a');

  const handleEditPress = (med: AdditionalMedication) => {
    setEditingMed(med);
    onAddPress(med); // open the form, passing the med to prefill
  };

  return (
    <Card style={styles.sectionCard}>
      <Card.Title 
        title="Additional Medications" 
        subtitle="Log any other medications you're taking"
        titleStyle={styles.sectionTitle}
        right={() => (
          <Button 
            mode="contained" 
            onPress={() => onAddPress()}
            style={styles.addButton}
          >
            Add
          </Button>
        )}
      />
      <Card.Content>
        {additionalMeds.length > 0 ? (
          <List.Section>
            {additionalMeds.map(med => (
              <List.Item
                key={med.id}
                title={`${med.name} (${med.dosage})`}
                description={`Taken at: ${formatDateTime(med.taken_at)}\nReason: ${med.reason || 'Not specified'}`}
                left={() => <List.Icon icon="pill" />}
                right={() => (
                  <View style={styles.sideEffectsContainer}>
                    {med.side_effects && (
                      <Text style={styles.sideEffectsText}>
                        Side effects: {med.side_effects || 'None reported'}
                      </Text>
                    )}
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => onAddPress(med)}
                    />
                  </View>
                )}
              />
            ))}
          </List.Section>
        ) : (
          <Text style={styles.noItemsText}>No additional medications logged yet</Text>
        )}
      </Card.Content>
    </Card>
  );
};
