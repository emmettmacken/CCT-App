import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../backend/supabaseClient"; 
import { registerPushToken } from "../notifications";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1 Register device push token
        await registerPushToken();

        // 2 Fetch current user
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching user:", error.message);
          setRedirectTo("/login");
          return;
        }

        if (!user) {
          setRedirectTo("/login");
          return;
        }

        // 3 Fetch user's role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile role:", profileError.message);
          setRedirectTo("/login");
          return;
        }

        // 4 Redirect based on role
        switch (profile.role) {
          case "patient":
            setRedirectTo("../(patient)/home");
            break;
          case "clinician":
            setRedirectTo("../(clinician)/home");
            break;
          case "admin":
            setRedirectTo("../(admin)/home");
            break;
          default:
            console.warn("Unknown role, redirecting to login");
            setRedirectTo("/login");
        }

      } catch (err) {
        console.error("Startup error:", err);
        setRedirectTo("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Loading spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect
  if (redirectTo) {
    return <Redirect href={redirectTo as any} />;
  }

  return null;
}
