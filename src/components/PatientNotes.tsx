import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { supabase } from "../backend/supabaseClient";

interface PatientNotesProps {
  patientId: string;
}

const PatientNotes: React.FC<PatientNotesProps> = ({ patientId }) => {
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch notes from profiles.notes
  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("notes")
      .eq("id", patientId)
      .single();

    if (error) {
      console.log("Error fetching notes:", error.message);
    } else if (data) {
      setNotes(data.notes || "");
    }

    setLoading(false);
  };

  // Autosave notes with debounce
  const autoSaveNotes = (newNotes: string) => {
    setNotes(newNotes);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ notes: newNotes })
        .eq("id", patientId);

      if (error) console.log("Error saving notes:", error.message);
      setSaving(false);
    }, 1000); // 1 second debounce
  };

  useEffect(() => {
    fetchNotes();
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [patientId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Loading notes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
      <Text style={{ marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>
        Shared Patient Notes {saving ? "(Saving...)" : ""}
      </Text>

      <TextInput
        value={notes}
        onChangeText={autoSaveNotes}
        multiline
        placeholder="Enter notes here..."
        style={{
          flex: 1,
          textAlignVertical: "top",
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ccc",
          backgroundColor: "#f8f8f8",
          fontSize: 14,
        }}
      />
    </View>
  );
};

export default PatientNotes;
