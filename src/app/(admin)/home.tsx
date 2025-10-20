import React from "react";
import { ScrollView, Text } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Button } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AssessmentSection } from "../../components/AssessmentSection";
import { BasicTrialInfoCard } from "../../components/BasicTrialInfoCard";
import { MedicationSection } from "../../components/MedicationSection";
import { categoryOptions } from "../../constants/Admin";
import { useTrialData } from "../../hooks/useTrialData";
import { styles } from "../../styles/adminHome.styles";

const AdminTrialTemplateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const trialData = useTrialData();

  const {
    name,
    protocolVersion,
    trialPhase,
    numberOfCycles,
    cycleDurationDays,
    notes,
    trials,
    selectedTrialId,
    openTrialDropdown,
    setName,
    setProtocolVersion,
    setTrialPhase,
    setNumberOfCycles,
    setCycleDurationDays,
    setNotes,
    setSelectedTrialId,
    setOpenTrialDropdown,
    saving,
    saveTemplate,
  } = trialData;

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create / Edit Trial Template</Text>

        {/* Select Existing Trial */}
        <Text style={{ marginBottom: 8 }}>Edit an existing trial:</Text>
        <DropDownPicker
          open={openTrialDropdown}
          value={selectedTrialId}
          items={trials.map((t) => ({ label: t.name, value: t.id }))}
          setOpen={setOpenTrialDropdown}
          setValue={setSelectedTrialId}
          placeholder="Select a trial to edit"
          style={{ marginBottom: 16 }}
          listMode="MODAL"
          modalProps={{ animationType: "slide" }}
        />

        <BasicTrialInfoCard
          {...{
            name,
            setName,
            protocolVersion,
            setProtocolVersion,
            trialPhase,
            setTrialPhase,
            numberOfCycles,
            setNumberOfCycles,
            cycleDurationDays,
            setCycleDurationDays,
            notes,
            setNotes,
          }}
        />

        <AssessmentSection {...trialData} categoryOptions={categoryOptions} />
        <MedicationSection {...trialData} />

        <Button
          mode="contained"
          onPress={saveTemplate}
          disabled={saving}
          style={{ marginVertical: 16 }}
        >
          {saving ? "Saving..." : "Save Trial Template"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTrialTemplateScreen;
