import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { List } from 'react-native-paper';
import { styles } from '../../styles/faq.styles';
import { supabase } from '../../../backend/supabaseClient';

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

        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Contact the Clinical Trials Unit at University Hospital Limerick:
          </Text>
          <Text style={styles.contactDetail}>Phone: (087) 382 4221</Text>
          <Text style={styles.contactDetail}>Email: clinicaltrials@uhl.ie</Text>
          <Text style={styles.contactDetail}>Hours: Mon-Fri, 9am-5pm</Text>
          <Text style={styles.contactDetail}>Feeling unwell outside of hours? Contact: 061482900</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQScreen;