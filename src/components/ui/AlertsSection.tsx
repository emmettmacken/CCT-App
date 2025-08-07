import React from 'react';
import { Text } from 'react-native';
import { Card, List, Button, Badge } from 'react-native-paper';
import { Alert } from '../../types/clinician';
import { styles } from '../../styles/clinicianhome.styles';

interface Props {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
  getAlertIcon: (type: Alert['type']) => string;
  getAlertColor: (type: Alert['type']) => string;
}

const AlertsSection: React.FC<Props> = ({ alerts, onMarkAsRead, getAlertIcon, getAlertColor }) => (
  <Card style={styles.card}>
    <Card.Title
      title="Alerts"
      titleStyle={styles.cardTitle}
      right={() => <Badge size={24} style={styles.badge}>{alerts.length}</Badge>}
    />
    <Card.Content>
      {alerts.length > 0 ? (
        <List.Section>
          {alerts.map(alert => (
            <List.Item
              key={alert.id}
              title={alert.title}
              description={alert.message}
              left={() => <List.Icon icon={getAlertIcon(alert.type)} color={getAlertColor(alert.type)} />}
              right={() => <Button onPress={() => onMarkAsRead(alert.id)} textColor="#3f51b5">Dismiss</Button>}
              style={styles.alertItem}
              titleStyle={styles.alertTitle}
              descriptionStyle={styles.alertDescription}
            />
          ))}
        </List.Section>
      ) : (
        <Text style={styles.noItemsText}>No new alerts</Text>
      )}
    </Card.Content>
  </Card>
);

export default AlertsSection;