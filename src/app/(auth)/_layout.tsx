import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../backend/supabaseClient";

export default function AuthLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) console.error("Session error:", error.message);

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile) {
          console.error("Profile fetch error:", profileError?.message);
          router.replace("../register");
          return;
        }

        const role = profile.role;
        if (role === "clinician") router.replace("/(clinician)/home");
        else if (role === "admin") router.replace("/(admin)/home");
        else router.replace("/(patient)/home");
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Stack screenOptions={{ headerShown: false }}></Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
