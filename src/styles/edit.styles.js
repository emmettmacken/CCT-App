import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainButton: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 10,
  },
  modalContent: {
    paddingBottom: 100,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    marginVertical: 8,
  },
  option: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginVertical: 3,
  },
  optionSelected: {
    backgroundColor: "#007AFF",
  },
  currentValue: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});