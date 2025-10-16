import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../backend/supabaseClient"; 
import {
  registerForPushNotificationsAsync,
  scheduleAppointmentNotifications,
} from "../notifications";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1 Register for push notifications
        await registerForPushNotificationsAsync();

        // 2 Get current user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error.message);
        }

        // 3 Schedule notifications if logged in
        if (user) {
          await scheduleAppointmentNotifications(user.id);
          setRedirectTo("../(patient)/home");
        } else {
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

  // 4 Show a loading screen briefly while setting up
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

  // 5 Redirect to correct page once setup complete
  if (redirectTo) {
    return (
      <View style={{ flex: 1 }}>
        <Redirect href={redirectTo as any} />
      </View>
    );
  }

  return null;
}
