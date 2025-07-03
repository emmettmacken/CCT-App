import { View, Text, TextInput, TouchableOpacity} from 'react-native';
import React, { useState } from 'react';
import Button from '../../components/Button';
import { Link, Stack } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { styles } from "../../styles/auth.styles";

const roles = [
  { label: "Patient", value: "patient" },
  { label: "Clinician", value: "clinician" },
];

const SignUpScreen = () => {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign up" }} />

      <Text style={styles.label}>Role</Text>
      <Dropdown
        style={styles.input}
        data={roles}
        labelField="label"
        valueField="value"
        placeholder="Select your role"
        value={role}
        onChange={(item) => setRole(item.value)}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="johndoe@gmail.com"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder=""
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => alert("Test")}>
      <Button text="Create account" />
      </TouchableOpacity>
      <Link href="../../login" style={styles.textButton}>
        Sign in
      </Link>
    </View>
  );
};

export default SignUpScreen;