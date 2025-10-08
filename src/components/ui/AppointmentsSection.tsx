import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Text, View } from "react-native";
import { Button, Card, List } from "react-native-paper";
import { styles } from "../../styles/clinicianHome.styles";
import { Appointment } from "../../types/clinician";

interface Props {
  appointments: Appointment[];
}

const AppointmentsSection: React.FC<Props> = ({ appointments }) => {
  const navigation = useNavigation<any>();

  // Group appointments by patient
  const groupedAppointments = appointments.reduce((acc, appt) => {
    const patient =
      appt.patient_name || appt.profiles?.name || "Unknown Patient";
    if (!acc[patient]) acc[patient] = [];
    acc[patient].push(appt.title);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Today's Appointments"
        titleStyle={styles.cardTitle}
        right={() => (
          <Text style={styles.appointmentCount}>
            {appointments.length} scheduled
          </Text>
        )}
      />
      <Card.Content>
        {appointments.length > 0 ? (
          <List.Section>
            {Object.entries(groupedAppointments).map(([patient, titles]) => (
              <List.Item
                key={patient}
                title={patient}
                description={titles.join(", ")} // all titles for that patient
                left={() => <View style={styles.statusIndicator} />}
                right={() => (
                  <Button
                    mode="outlined"
                    onPress={() =>
                      navigation.navigate("calendar", {
                        patient,
                        autoOpen: true,
                        date: new Date().toISOString().split("T")[0],
                      })
                    }
                    style={styles.viewButton}
                    labelStyle={styles.viewButtonLabel}
                  >
                    View
                  </Button>
                )}
                style={styles.appointmentItem}
              />
            ))}
          </List.Section>
        ) : (
          <Text style={styles.noItemsText}>
            No appointments scheduled for today
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

export default AppointmentsSection;
