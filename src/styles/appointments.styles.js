import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendar: {
    margin: 16,
    borderRadius: 10,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3f51b5',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    color: '#333',
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
  requirementsCard: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3f51b5',
  },
  requirementText: {
    marginBottom: 8,
    color: '#555',
  },
  medicationText: {
    marginLeft: 15,
    marginBottom: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#3f51b5',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  attendance:{
    fontSize: 16,
    color: '#999',
    marginBottom: 0,
    textAlign: 'center',
  },
  time: {
    color: '#3f51b5',
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
});