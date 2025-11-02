import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./backend/supabaseClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken() {
  try {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device.");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permissions not granted.");
      return;
    }

    // Must include projectId for Android standalone builds
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId:
        Constants.expoConfig.extra?.eas?.projectId ||
        Constants.easConfig?.projectId,
    });
    const token = tokenResponse.data;
    console.log("Expo Push Token:", token);

    // Wait until Supabase session restores
    let {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retry = await supabase.auth.getUser();
      user = retry.data.user;
    }
    if (!user) {
      console.warn("No authenticated user found — cannot save token.");
      return;
    }

    // Save token
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, expo_push_token: token }, { onConflict: "id" });

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
