import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3f51b5',
    textAlign: 'center',
  },
  accordion: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  question: {
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: 16,
    flexWrap: 'wrap'
  },
  answer: {
    padding: 16,
    paddingTop: 8,
    color: '#555',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
  },
  contactContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3f51b5',
  },
  contactText: {
    marginBottom: 8,
    color: '#555',
  },
  contactDetail: {
    marginLeft: 8,
    marginBottom: 4,
    color: '#333',
  },
});