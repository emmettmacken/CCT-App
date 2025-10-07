import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filterContainer: {
    padding: 16,
  },
  searchInput: {
    marginBottom: 12,
    backgroundColor: "white",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  listItem: {
    backgroundColor: "white",
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3f51b5",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginLeft: 20,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  dateText: {
    color: "#666",
    fontSize: 12,
  },
  badge: {
    backgroundColor: "#f44336",
    marginTop: 4,
  },
  noPatientsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  profileContainer: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 16,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3f51b5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 36,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileDetails: {
    color: "#666",
    fontSize: 16,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff3e0",
  },
  cardTitle: {
    color: "#3f51b5",
    fontWeight: "bold",
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fastingAlert: {
    backgroundColor: "#ff9800",
  },
  allergyAlert: {
    backgroundColor: "#f44336",
  },
  precautionAlert: {
    backgroundColor: "#2196f3",
  },
  alertIconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  alertText: {
    flex: 1,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontWeight: "bold",
    color: "#333",
  },
  activeTabText: {
    color: "white",
  },
  contentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4caf50",
    alignSelf: "center",
  },
  completedStatus: {
    backgroundColor: "#4caf50",
  },
  missedStatus: {
    backgroundColor: "#f44336",
  },
  upcomingStatus: {
    backgroundColor: "#2196f3",
  },
  noDataText: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#3f51b5",
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  closeButton: {
    flex: 1,
    marginRight: 10,
    borderColor: "#3f51b5",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: "#3f51b5",
  },
  deleteButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#ba332cff",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#47b53fff",
  },
  trialOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f8f8f8",
    marginBottom: 12,
  },
  activeTrialOption: {
    backgroundColor: "#007AFF",
    borderColor: "#3f51b5",
  },
  trialOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  activeTrialOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  offsetAppointment: {
    marginBottom: 10,
    backgroundColor: "#2196f3",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addAppointment: {
    marginBottom: 10,
    backgroundColor: "#47b53fff",
  },
  addMedication: {
    marginBottom: 10,
    backgroundColor: "#47b53fff",
  },
  massEditButton: {
    backgroundColor: "#2196f3",
  }
});