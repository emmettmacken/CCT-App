import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import Button from "../../components/Button";
import { Link, router, Stack } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { styles } from "../../styles/auth.styles";
import { supabase } from "../../../backend/supabaseClient"; 

const roles = [
  { label: "Select your role", value: "" },
  { label: "Patient", value: "patient" },
  { label: "Clinician", value: "clinician" },
];

const SignUpScreen = () => {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !role) {
      alert("Please fill in all fields.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully! Please check your email.");
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign up" }} />
      <Image 
      source={{uri: 'https://cdni.iconscout.com/illustration/premium/thumb/create-account-illustration-download-in-svg-png-gif-file-formats--user-add-profile-login-business-bubble-pack-illustrations-6110939.png'}} 
      style= {{
        width: 400, 
        height: 350, 
        alignSelf: 'center', 
        marginBottom: 20}} 
      />

      <Text style={styles.label}>Create your account</Text>
      <Dropdown
        style={styles.dropdown}
        data={roles}
        labelField="label"
        valueField="value"
        placeholder="Select your role"
        value={role}
        onChange={(item) => setRole(item.value)}
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

      <TouchableOpacity onPress={handleSignUp}>
        <Button text="Create account" />
      </TouchableOpacity>

      <Link href="../../login" style={styles.textButton}>
        Sign in
      </Link>
    </View>
  );
};

export default SignUpScreen;