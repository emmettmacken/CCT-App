import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "../backend/supabaseClient";

// Configure how notifications behave when received (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  
    shouldShowList: true,     // ensures it shows in notification center
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken() {
  try {
    // 1 Ensure it's a physical device (emulators won't work)
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device.");
      return;
    }

    // 2 Check for permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permissions not granted.");
      return;
    }

    // 3 Get Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    console.log("Expo Push Token:", token);

    // 4 Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      console.warn("No authenticated user found — cannot save token.");
      return;
    }

    // 5 Save Expo token to Supabase `profiles` table
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, expo_push_token: token },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("Failed to save Expo push token:", upsertError.message);
    } else {
      console.log("Expo push token saved to Supabase profile.");
    }

    return token;
  } catch (error) {
    console.error("Error registering push token:", error);
  }
}
