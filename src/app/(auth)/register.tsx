import { Link, router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { supabase } from "../../../backend/supabaseClient";
import Button from "../../components/Button";
import { styles } from "../../styles/auth.styles";

const SignUpScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (): Promise<void> => {
    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (signUpError) {
      alert(signUpError.message);
      return;
    }

    const userId = authData.user?.id;

    if (!userId) {
      alert("User ID not found. Please try again.");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", userId);

      if (profileError) {
        alert("Error saving profile: " + profileError.message);
        return;
      }


    alert("Account created successfully! Please check your email.");
    router.replace("/login");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Stack.Screen options={{ title: "Sign up" }} />
          <Image
            source={{
              uri: "https://cdni.iconscout.com/illustration/premium/thumb/create-account-illustration-download-in-svg-png-gif-file-formats--user-add-profile-login-business-bubble-pack-illustrations-6110939.png",
            }}
            style={{
              width: 400,
              height: 350,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <Text style={styles.label}>Create your account</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            style={styles.input}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              style={[styles.input, { flex: 1 }]}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={{ marginLeft: -30 }}
            >
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          <Button
            text="Create account"
            onPress={handleSignUp}
            style={{ width: "100%" }}
          />

          <Link href="../../login" style={styles.textButton}>
            Sign in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;