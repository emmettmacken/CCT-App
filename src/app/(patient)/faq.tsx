import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert } from 'react-native';
import { List } from 'react-native-paper';
import { styles } from '../../styles/faq.styles';
import { supabase } from '../../../backend/supabaseClient';
import * as Linking from "expo-linking";

const FAQScreen = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching FAQs:", error);
      } else {
        setFaqs(data || []);
      }
    };

    fetchFaqs();
  }, []);

  const handlePress = (id: number) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Frequently Asked Questions</Text>
        
        <View style={styles.contactContainer}>
  <Text style={styles.contactTitle}>Need to get in contact?</Text>
  <Text style={styles.contactText}>
    Contact the Clinical Trials Unit at University Hospital Limerick:
  </Text>

  {/* Phone */}
  <Text style={styles.contactDetail}>
    Phone:{" "}
    <Text
      style={{ color: "blue", textDecorationLine: "underline" }}
      onPress={() =>
        Alert.alert("Call", "Do you want to ring (087) 382 4221?", [
          { text: "Cancel", style: "cancel" },
          { text: "Ring", onPress: () => Linking.openURL("tel:0871234567") },
        ])
      }
    >
      (087) 382 4221
    </Text>
  </Text>

   {/* Email */}
  <Text style={styles.contactDetail}>
    Email:{" "}
    <Text
      style={{ color: "blue", textDecorationLine: "underline" }}
      onPress={() => Linking.openURL("mailto:clinicaltrials@uhl.ie")}
    >
      clinicaltrials@uhl.ie
    </Text>
  </Text>

  <Text style={styles.contactDetail}>Hours: Mon-Fri, 9am-5pm</Text>

   {/* Out-of-hours phone */}
  <Text style={styles.contactDetail}>
    Feeling unwell outside of hours? Contact:{" "}
    <Text
      style={{ color: "blue", textDecorationLine: "underline" }}
      onPress={() =>
        Alert.alert("Call", "Do you want to ring 061 482 900?", [
          { text: "Cancel", style: "cancel" },
          { text: "Ring", onPress: () => Linking.openURL("tel:061482900") },
        ])
      }
    >
      061 482 900
    </Text>
  </Text>
</View>

        <List.Section>
          {faqs.map((faq, index) => (
            <List.Accordion
              key={faq.id}
              title={faq.question}
              titleStyle={styles.question}
              descriptionStyle={styles.answer}
              expanded={expandedIds.includes(index)}
              onPress={() => handlePress(index)}
              style={styles.accordion}
              titleNumberOfLines={4}
            >
              <Text style={styles.answer}>{faq.answer}</Text>
            </List.Accordion>
          ))}
        </List.Section>

      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQScreen;