import { View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import React, { useState } from 'react'
import Button from '../../components/Button';
import { Link, Stack, useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { styles } from "../../styles/auth.styles";
import { supabase } from "../../../backend/supabaseClient"; 

const SignInScreen = () => {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const roles = [
    { label: 'Select your role', value: '' },
    { label: 'Patient', value: 'patient' },
    { label: 'Clinician', value: 'clinician' },
  ];

  const handleSignIn = () => {
    if (email && password && role) {
      router.replace('/(tabs)');
    } else {
      alert('Please enter all fields');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <Image 
      source={{uri: 'https://imgs.search.brave.com/CYbqgI2PRnH_R1lLHQbYpoxYLz6kvOlt094sfsT1dmA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG5p/Lmljb25zY291dC5j/b20vaWxsdXN0cmF0/aW9uL3ByZW1pdW0v/dGh1bWIvbW9iaWxl/LWxvZ2luLWlsbHVz/dHJhdGlvbi1kb3du/bG9hZC1pbi1zdmct/cG5nLWdpZi1maWxl/LWZvcm1hdHMtLXVz/ZXItcGFzc3dvcmQt/cHJvZmlsZS1sb29w/eS1wYWNrLXBlb3Bs/ZS1pbGx1c3RyYXRp/b25zLTYwOTEzOTAu/cG5n'}}
      style= {{ 
        width: 380, 
        height: 350, 
        alignSelf: 'center', 
        marginBottom: 20}}
        />

      <Text style={styles.label}>Log in to your account</Text>
      <Dropdown
        style={styles.input}
        data={roles}
        labelField="label"
        valueField="value"
        placeholder="Select your role"
        value={role}
        onChange={item => setRole(item.value)}
        containerStyle={styles.dropdownContainer}
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleSignIn}>
      <Button text="Sign in" />
      </TouchableOpacity>

      <Link href="../../register" style={styles.textButton}>
        Create an account
      </Link>
    </View>
  );
};

export default SignInScreen;