import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../backend/supabaseClient";
import { useTabRefresh } from "../../hooks/useTabRefresh";
import { styles } from "../../styles/profile.styles";

interface AdminProfile {
  name: string;
}

const AdminSettings: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile>({
    name: "",
  });
  const [tempProfile, setTempProfile] = useState<AdminProfile>({
    ...profile,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData: AdminProfile = {
          name: data.name || "",
        };
        setProfile(profileData);
        setTempProfile(profileData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch profile");
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useTabRefresh(fetchProfile);

  const handleInputChange = (
    field: keyof AdminProfile,
    value: string | number
  ) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          name: tempProfile.name,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(tempProfile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setIsEditing(false);
  };

  // In-app password change
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Weak password. Please choose a stronger password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;

              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
              console.error("Error logging out:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={tempProfile.name?.toString() || ""}
              onChangeText={(text) => handleInputChange("name", text)}
              keyboardType="default"
            />
          ) : (
            <Text style={styles.value}>
              {tempProfile.name?.toString() || "N/A"}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        {/* Toggle to show password fields */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Switch
            value={showPasswordFields}
            onValueChange={setShowPasswordFields}
          />
          <Text style={{ marginLeft: 8 }}>Change Password</Text>
        </View>

        {showPasswordFields && (
          <>
            <TextInput
              placeholder="New Password"
              secureTextEntry
              style={[styles.input, { marginBottom: 12 }]}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry
              style={[styles.input, { marginBottom: 16 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={[styles.button, styles.passwordButton]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AdminSettings;
