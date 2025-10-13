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
  card: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  badge: {
    backgroundColor: '#f44336',
    marginRight: 16,
  },
  alertItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
  },
  markAsReadButton: {
    fontSize: 12,
    color: '#3f51b5',
  },
  noItemsText: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 16,
  },
  appointmentCount: {
    color: '#666',
    marginRight: 16,
    fontSize: 14,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    alignSelf: 'center',
  },
  completedStatus: {
    backgroundColor: '#9e9e9e',
  },
  cancelledStatus: {
    backgroundColor: '#f44336',
  },
  appointmentItem: {
    paddingVertical: 12,
  },
  viewButton: {
    borderColor: '#3f51b5',
  },
  viewButtonLabel: {
    color: '#3f51b5',
    fontSize: 12,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  quickLink: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  quickLinkText: {
    marginTop: 8,
    color: '#3f51b5',
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});