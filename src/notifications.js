import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "../backend/supabaseClient";

// Setup notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper: Register for permissions
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  // Save the Expo Push Token in Supabase (profiles table)
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) {
      console.warn("No authenticated user found — cannot save token.");
      return token;
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, expo_push_token: token },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("Failed to upsert expo_push_token:", upsertError.message);
    } else {
      console.log("Saved Expo push token to Supabase profile");
    }
  } catch (err) {
    console.error("Error saving Expo push token:", err);
  }

  return token;
}

// Fetch tomorrow’s appointments
async function getTomorrowsAppointments(userId) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .eq("date", formattedDate);

  if (error) {
    console.error("Error fetching appointments:", error.message);
    return [];
  }

  return data || [];
}

// Fetch today’s medications
async function getTodaysMedications(userId) {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("trial_medications")
    .select("*")
    .eq("user_id", userId)
    .eq("scheduled_date", formattedDate);

  if (error) {
    console.error("Error fetching medications:", error.message);
    return [];
  }

  return data || [];
}

// Schedule single notification
async function scheduleNotification(id, title, body, triggerDate) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default", data: { id } },
      trigger: { type: "date", date: triggerDate },
    });
    console.log(`Scheduled [${id}] for ${triggerDate.toLocaleString()}`);
  } catch (error) {
    console.error(`Failed to schedule [${id}]:`, error);
  }
}

// Main function
export async function scheduleAppointmentNotifications(userId) {
  try {
    const todayKey = new Date().toISOString().split("T")[0];
    const lastScheduled = await AsyncStorage.getItem("lastScheduledDate");

    // Avoid rescheduling multiple times per day
    if (lastScheduled === todayKey) {
      console.log("Notifications already scheduled today — skipping.");
      return;
    }

    // Clear all previously scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Cleared all old scheduled notifications");

    // Fetch required data
    const appointments = await getTomorrowsAppointments(userId);
    const hasFasting = appointments.some((a) => a.fasting_required);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toLocaleDateString();

    const meds = await getTodaysMedications(userId);
    const now = new Date();

    // Appointment notifications
    const appointmentTimes = [
      {
        id: "apptMorning",
        hour: 11,
        minute: 0,
        title: "Appointment Reminder",
        body: `You have appointments scheduled for ${dateString}. Please review your appointments.`,
      },
      {
        id: "apptEvening",
        hour: 19,
        minute: 0,
        title: "Appointment Reminder",
        body: `You have appointments tomorrow. Take a moment to look at them in app.`,
      },
    ];

    for (const { id, hour, minute, title, body } of appointmentTimes) {
      const notifTime = new Date();
      notifTime.setHours(hour, minute, 0, 0);

      if (notifTime > now && appointments.length > 0) {
        await scheduleNotification(id, title, body, notifTime);
      }
    }

    // Fasting reminder (8 PM)
    if (hasFasting) {
      const fastingTime = new Date();
      fastingTime.setHours(20, 0, 0, 0);

      if (fastingTime > now) {
        await scheduleNotification(
          "fastingReminder",
          "Fasting Reminder",
          "Reminder: You must fast for your appointment tomorrow.",
          fastingTime
        );
      }
    }

    // Medication reminder (12 PM)
    if (meds.length > 0) {
      const medTime = new Date();
      medTime.setHours(12, 0, 0, 0);

      if (medTime > now) {
        await scheduleNotification(
          "medReminder",
          "Medication Reminder",
          "Have you taken your trial medications today?",
          medTime
        );
      }
    }

    // Store that today’s notifications were scheduled
    await AsyncStorage.setItem("lastScheduledDate", todayKey);
    console.log("Stored today's scheduling date");

    // Log confirmation
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log("Final scheduled notifications:", scheduled.length);
  } catch (err) {
    console.error("Error scheduling notifications:", err);
  }
}
