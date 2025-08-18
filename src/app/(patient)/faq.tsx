import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { List } from 'react-native-paper';
import { styles } from '../../styles/faq.styles';

const FAQScreen = () => {
  const faqs = [
    {
      question: "What should I do if I miss a medication dose?",
      answer: "If you miss a dose of your trial medication, contact your clinical trial coordinator immediately. Do not take a double dose to make up for the missed one."
    },
    {
      question: "What are the common side effects I might experience?",
      answer: "Common side effects vary depending on the medication but may include nausea, fatigue, headache, or mild fever. Always report any side effects to your clinical team, even if they seem minor."
    },
    {
      question: "Can I take over-the-counter medications during the trial?",
      answer: "You should consult with your clinical trial team before taking any additional medications, including over-the-counter drugs, supplements, or herbal remedies, as they may interfere with the trial treatment."
    },
    {
      question: "What should I do if I experience severe side effects?",
      answer: "If you experience severe side effects such as difficulty breathing, chest pain, severe rash, or swelling, seek immediate medical attention and then notify your clinical trial team as soon as possible."
    },
    {
      question: "What should I do if unforeseen circumstances, (e.g. injury and admission to hospital) result in missing an appointment?",
      answer: "If you miss an appointment due to unforeseen circumstances, contact your clinical trial coordinator as soon as possible to reschedule. They will provide guidance on how to proceed and whether any additional steps are needed. If admitted to the hospital, inform the clinical team about your hospitalization so they can monitor your trial participation and medication."
    },
    {
      question: "What should I bring to my appointments?",
      answer: "Bring your trial ID card, a list of all medications you're taking (including doses), any symptoms or side effects you've experienced since your last visit, and questions you may have for the clinical team."
    },
    {
      question: "Will I be compensated for participating in the trial?",
      answer: "Compensation policies vary by trial. Some trials may reimburse for travel expenses or provide a stipend for your time. Your clinical trial coordinator can provide details about compensation for your specific trial."
    },
    {
      question: "What happens if I want to leave the trial early?",
      answer: "You can leave the clinical trial at any time for any reason. If you decide to withdraw, you'll need to complete an exit visit so the clinical team can ensure your safe transition out of the trial."
    }
  ];

  const [expandedIds, setExpandedIds] = React.useState<number[]>([]);

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
              key={index}
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