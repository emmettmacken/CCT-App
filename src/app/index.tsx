import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../backend/supabaseClient";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Check for authenticated user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error.message);
          setRedirectTo("/login");
          return;
        }

        // If no active session, redirect to login
        if (!user) {
          setRedirectTo("/login");
          return;
        }

        // Fetch user's role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error(
            "Error fetching profile role:",
            profileError?.message || "No profile found"
          );
          setRedirectTo("/login");
          return;
        }

        // Redirect based on user role
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

  // Show loading spinner while checking session
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect once we know where to go
  if (redirectTo) {
    return <Redirect href={redirectTo as any} />;
  }

  return null;
}
