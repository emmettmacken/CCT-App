// components/BasicTrialInfoCard.tsx
import React from "react";
import { Card, TextInput } from "react-native-paper";
import { styles } from "../styles/adminHome.styles";

interface Props {
  name: string;
  setName: (v: string) => void;
  protocolVersion: string;
  setProtocolVersion: (v: string) => void;
  trialPhase: string;
  setTrialPhase: (v: string) => void;
  numberOfCycles: string;
  setNumberOfCycles: (v: string) => void;
  cycleDurationDays: string;
  setCycleDurationDays: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export const BasicTrialInfoCard: React.FC<Props> = ({
  name,
  setName,
  protocolVersion,
  setProtocolVersion,
  trialPhase,
  setTrialPhase,
  numberOfCycles,
  setNumberOfCycles,
  cycleDurationDays,
  setCycleDurationDays,
  notes,
  setNotes,
}) => (
  <Card style={styles.card}>
    <Card.Title title="Basic Trial Information" />
    <Card.Content>
      <TextInput
        label="Trial Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Protocol Version"
        value={protocolVersion}
        onChangeText={setProtocolVersion}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Phase (eg. Induction, Maintenance, etc.)"
        value={trialPhase}
        onChangeText={setTrialPhase}
        mode="outlined"
        style={styles.input}
      />
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
      <TextInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
        style={[styles.input, { minHeight: 80 }]}
      />
    </Card.Content>
  </Card>
);
