import React from "react";
import { Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import {
  Button,
  Card,
  IconButton,
  Switch,
  TextInput,
} from "react-native-paper";
import { styles } from "../styles/adminHome.styles";
import { TrialMedication } from "../types/admin";

interface Props {
  medDraft: Partial<TrialMedication>;
  setMedDraft: React.Dispatch<React.SetStateAction<Partial<TrialMedication>>>;
  isOptional: boolean;
  setIsOptional: React.Dispatch<React.SetStateAction<boolean>>;
  openOptionalCategoryDropdown: boolean;
  setOpenOptionalCategoryDropdown: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  optionalCategory: string | null;
  setOptionalCategory: React.Dispatch<React.SetStateAction<string | null>>;
  otherCategoryText: string;
  setOtherCategoryText: React.Dispatch<React.SetStateAction<string>>;
  openDayDropdown: boolean;
  setOpenDayDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  dayItems: any[];
  cycleOptions: number[];
  medications: TrialMedication[];
  startAddMedication: () => void;
  saveMedDraft: () => void;
  editMedication: (m: TrialMedication) => void;
  removeMedication: (id: string) => void;
}

export const MedicationSection: React.FC<Props> = ({
  medDraft,
  setMedDraft,
  isOptional,
  setIsOptional,
  openOptionalCategoryDropdown,
  setOpenOptionalCategoryDropdown,
  optionalCategory,
  setOptionalCategory,
  otherCategoryText,
  setOtherCategoryText,
  openDayDropdown,
  setOpenDayDropdown,
  dayItems,
  cycleOptions,
  medications,
  startAddMedication,
  saveMedDraft,
  editMedication,
  removeMedication,
}) => (
  <Card style={styles.card}>
    <Card.Title title="Medication Administration" />
    <Card.Content>
      <Button
        mode="outlined"
        onPress={startAddMedication}
        style={{ marginBottom: 12 }}
      >
        New Drug Regimen
      </Button>

      {medDraft && Object.keys(medDraft).length > 0 && (
        <View style={styles.draftContainer}>
          <TextInput
            label="Drug Name"
            value={medDraft.drug_name || ""}
            onChangeText={(t) =>
              setMedDraft((d) => ({
                ...(d as TrialMedication),
                drug_name: t,
              }))
            }
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Frequency"
            value={medDraft.frequency || ""}
            onChangeText={(t) =>
              setMedDraft((d) => ({
                ...(d as TrialMedication),
                frequency: t,
              }))
            }
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.label}>Administration Pattern</Text>
          <DropDownPicker
            multiple={true}
            open={openDayDropdown}
            value={medDraft.scheduled_days || []}
            items={dayItems}
            setOpen={setOpenDayDropdown}
            setValue={(callback) =>
              setMedDraft((d) => ({
                ...(d as TrialMedication),
                scheduled_days: callback(d?.scheduled_days || []),
              }))
            }
            placeholder="Select Administration Days"
            mode="BADGE"
            style={{ marginBottom: 8 }}
          />

          <Text style={styles.label}>Applicable Cycles</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {cycleOptions.map((c) => {
              const selected = (medDraft.applicableCycles || []).includes(c);
              return (
                <Button
                  key={c}
                  mode={selected ? "contained" : "outlined"}
                  onPress={() => {
                    const aps = new Set(medDraft.applicableCycles || []);
                    if (aps.has(c)) aps.delete(c);
                    else aps.add(c);
                    setMedDraft((d) => ({
                      ...(d as TrialMedication),
                      applicableCycles: Array.from(aps),
                    }));
                  }}
                  style={{ marginRight: 4, marginBottom: 4 }}
                >
                  {c}
                </Button>
              );
            })}
          </View>

          <TextInput
            label="Special Conditions"
            value={medDraft.specialConditions || ""}
            onChangeText={(t) =>
              setMedDraft((d) => ({
                ...(d as TrialMedication),
                // Use undefined (not null) to satisfy Partial<TrialMedication>
                specialConditions: t || undefined,
              }))
            }
            mode="outlined"
            style={styles.input}
          />

          {/* Optional Medication Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text>Optional Medication for specific patients</Text>
            <Switch
              value={isOptional}
              onValueChange={setIsOptional}
              style={{ marginLeft: 12 }}
            />
          </View>

          {isOptional && (
            <>
              <DropDownPicker
                open={openOptionalCategoryDropdown}
                value={optionalCategory}
                items={[
                  { label: "70+ only", value: "70+" },
                  { label: "High-risk", value: "high-risk" },
                  {
                    label: "Both 70+ and High-risk only",
                    value: "both 70+ and high-risk",
                  },
                  { label: "Other", value: "other" },
                ]}
                setOpen={setOpenOptionalCategoryDropdown}
                setValue={setOptionalCategory}
                placeholder="Select Category"
                style={{ marginBottom: 8 }}
                listMode="MODAL"
                modalProps={{ animationType: "slide" }}
              />
              {optionalCategory === "other" && (
                <TextInput
                  label="Specify Category"
                  value={otherCategoryText}
                  onChangeText={setOtherCategoryText}
                  mode="outlined"
                  style={{ marginBottom: 8 }}
                />
              )}
            </>
          )}

          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <Button
              mode="outlined"
              onPress={() => setMedDraft({})}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveMedDraft}
              style={{ flex: 1, marginLeft: 8 }}
            >
              Save Drug
            </Button>
          </View>
        </View>
      )}

      {medications.length > 0 ? (
        medications.map((m) => (
          <Card key={m.id} style={styles.itemCard}>
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>{m.drug_name}</Text>
                <View style={{ flexDirection: "row" }}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => editMedication(m)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeMedication(m.id)}
                  />
                </View>
              </View>
              <Text>Frequency: {m.frequency}</Text>
              <Text>Days: {(m.scheduled_days || []).join(", ")}</Text>
              {(m.applicableCycles || []).length > 0 && (
                <Text>Cycles: {(m.applicableCycles || []).join(", ")}</Text>
              )}
              {m.specialConditions && (
                <Text>Conditions: {m.specialConditions}</Text>
              )}
              {m.isOptional && <Text>Optional: {m.optionalCategory}</Text>}
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text>No medications added</Text>
      )}
    </Card.Content>
  </Card>
);
