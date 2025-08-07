import { Link, Stack, useRouter } from "expo-router";
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

const SignInScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleSignIn = async (): Promise<void> => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        alert("Error signing in: " + authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        alert("User not found");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile) {
        alert("Error fetching profile: " + profileError?.message);
        return;
      }

      const role = userProfile.role;

      if (role === "clinician") {
        router.replace("../(clinician)/dashboard");
      } else {
        router.replace("../(tabs)/home");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
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
          <Stack.Screen options={{ title: "Sign in" }} />
          <Image
            source={{
              uri: "https://imgs.search.brave.com/CYbqgI2PRnH_R1lLHQbYpoxYLz6kvOlt094sfsT1dmA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG5p/Lmljb25zY291dC5j/b20vaWxsdXN0cmF0/aW9uL3ByZW1pdW0v/dGh1bWIvbW9iaWxl/LWxvZ2luLWlsbHVz/dHJhdGlvbi1kb3du/bG9hZC1pbi1zdmct/cG5nLWdpZi1maWxl/LWZvcm1hdHMtLXVz/ZXItcGFzc3dvcmQt/cHJvZmlsZS1sb29w/eS1wYWNrLXBlb3Bs/ZS1pbGx1c3RyYXRp/b25zLTYwOTEzOTAu/cG5n",
            }}
            style={{
              width: 380,
              height: 350,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <Text style={styles.label}>Log in to your account</Text>

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
            text="Sign in"
            onPress={handleSignIn}
            style={{ width: "100%" }}
          />

          <Link href="../../register" style={styles.textButton}>
            Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default SignInScreen;