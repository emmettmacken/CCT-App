import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Card, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles/clinicianHome.styles';

const QuickLinksSection = () => {
  const navigation = useNavigation<any>();

  return (
    <Card style={styles.card}>
      <Card.Title title="Quick Links" titleStyle={styles.cardTitle} />
      <Card.Content style={styles.quickLinksContainer}>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('calendar')}>
          <List.Icon icon="calendar" color="#3f51b5" />
          <Text style={styles.quickLinkText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('patients')}>
          <List.Icon icon="account-group" color="#3f51b5" />
          <Text style={styles.quickLinkText}>Patient List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('faq')}>
          <List.Icon icon="help-circle" color="#3f51b5" />
          <Text style={styles.quickLinkText}>FAQ</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
};

export default QuickLinksSection;