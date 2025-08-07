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
  sectionCard: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  radioGroup: {
    marginBottom: 15,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    color: '#333',
  },
  logButton: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#3f51b5',
  },
  addButton: {
    marginRight: 8,
    backgroundColor: '#3f51b5',
  },
  noItemsText: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 16,
  },
  sideEffectsContainer: {
    justifyContent: 'center',
    maxWidth: '40%',
  },
  sideEffectsText: {
    fontSize: 12,
    color: '#d32f2f',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3f51b5',
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: '#3f51b5',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3f51b5',
  },
});