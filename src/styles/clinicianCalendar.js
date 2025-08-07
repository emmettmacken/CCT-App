import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  filterInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  calendar: {
    margin: 16,
    borderRadius: 10,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#3f51b5',
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
  datePickerButton: {
    marginTop: 10,
    marginBottom: 20,
    borderColor: '#3f51b5',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginVertical: 4,
    backgroundColor: '#3f51b5',
    flexBasis: '48%',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  closeButton: {
    marginTop: 20,
  },
});