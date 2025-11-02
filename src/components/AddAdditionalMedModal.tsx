import React, { useEffect, useState } from "react";
import { Modal, Platform, ScrollView, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../backend/supabaseClient";
import { styles } from "../styles/medications.styles";
import { AdditionalMedication } from "../types/medications";

interface Props {
  visible: boolean;
  onClose: () => void;
  refreshMeds: (meds: AdditionalMedication[]) => void;
  medToEdit?: AdditionalMedication | null;
}

export const AddAdditionalMedModal: React.FC<Props> = ({
  visible,
  onClose,
  refreshMeds,
  medToEdit,
}) => {
  const insets = useSafeAreaInsets();

  const [formMed, setFormMed] = useState<Omit<AdditionalMedication, "id">>({
    name: "",
    dosage: "",
    reason: "",
    user_id: "",
    taken_at: new Date().toISOString(),
  });

  // Prefill form when editing
  useEffect(() => {
    if (medToEdit) {
      const { id, ...rest } = medToEdit;
      setFormMed(rest);
    } else {
      setFormMed({
        name: "",
        dosage: "",
        reason: "",
        user_id: "",
        taken_at: new Date().toISOString(),
      });
    }
  }, [medToEdit, visible]);

  const handleSave = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (medToEdit) {
        await supabase
          .from("additional_medications_logs")
          .update({ ...formMed, user_id: user.id })
          .eq("id", medToEdit.id);
      } else {
        await supabase
          .from("additional_medications_logs")
          .insert([
            {
              ...formMed,
              user_id: user.id,
              taken_at: new Date().toISOString(),
            },
          ]);
      }

      const { data: updated } = await supabase
        .from("additional_medications_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("taken_at", new Date().toISOString().split("T")[0])
        .order("taken_at", { ascending: false });

      if (updated) refreshMeds(updated);
      onClose();
    } catch (error) {
      console.error("Error saving additional medication:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      {/* Overlay to dim background */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center", // keep it centered like before
          paddingTop: Platform.OS === "ios" ? insets.top : 0, // safe area padding
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
        }}
      >
        <SafeAreaView
          style={{
            backgroundColor: "#fff",
            marginHorizontal: 16,
            borderRadius: 16,
            maxHeight: "90%", // allow scrolling if content is too tall
            overflow: "hidden",
          }}
          edges={["top", "left", "right"]}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>
              {medToEdit
                ? "Edit Additional Medication"
                : "Add Additional Medication"}
            </Text>

            <TextInput
              label="Medication Name"
              value={formMed.name}
              onChangeText={(text) => setFormMed({ ...formMed, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Dosage"
              value={formMed.dosage}
              onChangeText={(text) => setFormMed({ ...formMed, dosage: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Reason for taking"
              value={formMed.reason}
              onChangeText={(text) => setFormMed({ ...formMed, reason: text })}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.submitButton}
                disabled={!formMed.name || !formMed.dosage || !formMed.reason}
              >
                {medToEdit ? "Update" : "Save"}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
