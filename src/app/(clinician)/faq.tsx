import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  IconButton,
  TextInput,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../../backend/supabaseClient";
import { useTabRefresh } from "../../hooks/useTabRefresh";
import { styles } from "../../styles/clinicianFaq.styles";
import { FAQ } from "../../types/faq";

const ClinicianFAQScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [questionInput, setQuestionInput] = useState<string>("");
  const [answerInput, setAnswerInput] = useState<string>("");

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let channel: any = null;

    fetchFaqs();

    // realtime subscription to keep clinician view in sync
    (async () => {
      channel = supabase
        .channel("public:faqs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "faqs" },
          (payload) => {
            setFaqs((prev) => {
              const exists = prev.some((f) => f.id === payload.new.id);
              if (exists) return prev;
              return [payload.new as FAQ, ...prev];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "faqs" },
          (payload) => {
            setFaqs((prev) =>
              prev.map((f) =>
                f.id === payload.new.id ? (payload.new as FAQ) : f
              )
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "faqs" },
          (payload) => {
            setFaqs((prev) => prev.filter((f) => f.id !== payload.old.id));
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useTabRefresh(fetchFaqs);

  const openAddModal = () => {
    setEditingFaq(null);
    setQuestionInput("");
    setAnswerInput("");
    setModalVisible(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setQuestionInput(faq.question);
    setAnswerInput(faq.answer);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!questionInput.trim() || !answerInput.trim()) {
      Alert.alert("Validation", "Please fill both question and answer.");
      return;
    }

    setSaving(true);

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update({
            question: questionInput.trim(),
            answer: answerInput.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFaq.id);

        if (error) throw error;

        setFaqs((prev) =>
          prev.map((f) =>
            f.id === editingFaq.id
              ? {
                  ...f,
                  question: questionInput.trim(),
                  answer: answerInput.trim(),
                  updated_at: new Date().toISOString(),
                }
              : f
          )
        );
      } else {
        const { data, error } = await supabase
          .from("faqs")
          .insert([
            {
              question: questionInput.trim(),
              answer: answerInput.trim(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setFaqs((prev) => [data as FAQ, ...prev]);
        }
      }

      setModalVisible(false);
    } catch (err) {
      console.error("Error saving FAQ:", err);
      Alert.alert("Error", "Failed to save FAQ. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (faq: FAQ) => {
    Alert.alert("Delete FAQ", "Are you sure you want to delete this FAQ?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("faqs")
              .delete()
              .eq("id", faq.id);
            if (error) throw error;
            setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
          } catch (err) {
            console.error("Error deleting FAQ:", err);
            Alert.alert("Error", "Failed to delete FAQ.");
          }
        },
      },
    ]);
  };

  const renderFaqItem = (faq: FAQ) => {
    return (
      <Card key={faq.id} style={styles.card}>
        <Card.Title
          title={faq.question}
          subtitle={`Updated: ${format(
            parseISO(faq.updated_at || faq.created_at),
            "PPpp"
          )}`}
          titleNumberOfLines={2}
          subtitleNumberOfLines={1}
          right={(props) => (
            <View style={styles.titleActions}>
              <IconButton
                {...props}
                icon="pencil"
                size={20}
                onPress={() => openEditModal(faq)}
              />
              <IconButton
                {...props}
                icon="delete"
                size={20}
                onPress={() => handleDelete(faq)}
              />
            </View>
          )}
        />
        <Card.Content>
          <Divider style={styles.divider} />
          <Text style={styles.answerText}>{faq.answer}</Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Patient FAQs</Text>
        <Button
          mode="contained"
          onPress={openAddModal}
          labelStyle={styles.addLabel}
        >
          Add FAQ
        </Button>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {faqs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No FAQs found. Add one using the button above.
              </Text>
            </View>
          ) : (
            faqs.map((faq) => renderFaqItem(faq))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={styles.modalSafeArea}
          edges={["top", "left", "right"]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setModalVisible(false)}
            />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              label="Question"
              value={questionInput}
              onChangeText={setQuestionInput}
              mode="outlined"
              multiline
              style={styles.input}
            />

            <TextInput
              label="Answer"
              value={answerInput}
              onChangeText={setAnswerInput}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, { height: 140 }]}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.modalButton}
              >
                {editingFaq ? "Save changes" : "Create FAQ"}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ClinicianFAQScreen;
