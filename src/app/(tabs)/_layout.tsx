import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/Colors";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <Tabs
          screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.grey,
            tabBarStyle: {
              backgroundColor: "black",
              borderTopWidth: 0,
              position: "absolute",
              elevation: 0,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="home" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="calendar-outline" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="medications"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="medkit" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="reminders"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="notifications" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="faq"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="help-outline" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="settings" size={28} color={color} />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}