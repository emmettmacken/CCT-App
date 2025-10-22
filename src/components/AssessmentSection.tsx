import React from "react";
import { Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import {
  Button,
  Card,
  IconButton,
  RadioButton,
  Switch,
  TextInput,
} from "react-native-paper";
import { styles } from "../styles/adminHome.styles";
import { Assessment } from "../types/admin";

interface Props {
  categoryOptions: string[];
  openDayDropdown: boolean;
  setOpenDayDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  dayItems: any[];
  assessmentDraft: Partial<Assessment>;
  setAssessmentDraft: React.Dispatch<React.SetStateAction<Partial<Assessment>>>;
  editingAssessmentId: string | null;
  assessments: Assessment[];
  startAddAssessment: () => void;
  saveAssessmentDraft: () => void;
  editAssessment: (a: Assessment) => void;
  removeAssessment: (id: string) => void;
  cycleOptions: number[];
  setEditingAssessmentId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AssessmentSection: React.FC<Props> = ({
  categoryOptions,
  openDayDropdown,
  setOpenDayDropdown,
  dayItems,
  assessmentDraft,
  setAssessmentDraft,
  editingAssessmentId,
  assessments,
  startAddAssessment,
  saveAssessmentDraft,
  editAssessment,
  removeAssessment,
  cycleOptions,
  setEditingAssessmentId,
}) => (
  <Card style={styles.card}>
    <Card.Title title="Assessments / Evaluations" />
    <Card.Content>
      <Button
        mode="outlined"
        onPress={startAddAssessment}
        style={{ marginBottom: 12 }}
      >
        New Assessment
      </Button>

      {assessmentDraft && Object.keys(assessmentDraft).length > 0 && (
        <View style={styles.draftContainer}>
          <TextInput
            label="Assessment Name"
            value={assessmentDraft.name || ""}
            onChangeText={(t) =>
              setAssessmentDraft((d) => ({
                ...(d as Assessment),
                name: t,
              }))
            }
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <RadioButton.Group
            onValueChange={(v) =>
              setAssessmentDraft((d) => ({
                ...(d as Assessment),
                category: v,
              }))
            }
            value={assessmentDraft.category || categoryOptions[0]}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {categoryOptions.map((c) => (
                <View
                  key={c}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <RadioButton value={c} />
                  <Text>{c}</Text>
                </View>
              ))}
            </View>
          </RadioButton.Group>

          <Text style={styles.label}>Scheduled Days</Text>
          <DropDownPicker
            multiple={true}
            open={openDayDropdown}
            value={assessmentDraft.scheduledDays ?? null}
            items={dayItems}
            setOpen={setOpenDayDropdown}
            setValue={(callback) =>
              setAssessmentDraft((d) => ({
                ...(d as Assessment),
                scheduledDays: callback(d?.scheduledDays || []),
              }))
            }
            placeholder="Select Scheduled Days"
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
              const draftCycles: number[] = ((assessmentDraft as any).applicableCycles) || [];
              const selected = draftCycles.includes(c);
              return (
                <Button
                  key={c}
                  mode={selected ? "contained" : "outlined"}
                  onPress={() => {
                    const aps = new Set(draftCycles);
                    if (aps.has(c)) aps.delete(c);
                    else aps.add(c);
                    setAssessmentDraft((d) => ({
                      ...(d as Assessment),
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
            label="Requirements?"
            value={(assessmentDraft as any).requirements || ""}
            onChangeText={(t) =>
              setAssessmentDraft((d) => ({
                ...(d as Assessment),
                requirements: t,
              }))
            }
            mode="outlined"
            multiline
            style={[styles.input, { minHeight: 80 }]}
          />

          <Text style={styles.label}>Fasting Required?</Text>
          <Switch
            value={assessmentDraft.fasting_required || false}
            onValueChange={(v) =>
              setAssessmentDraft((d) => ({
                ...(d as Assessment),
                fasting_required: v,
              }))
            }
          />

          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <Button
              mode="outlined"
              onPress={() => {
                setAssessmentDraft({});
                setEditingAssessmentId(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveAssessmentDraft}
              style={{ flex: 1, marginLeft: 8 }}
            >
              {editingAssessmentId ? "Update Assessment" : "Save Assessment"}
            </Button>
          </View>
        </View>
      )}

      {assessments.length > 0 ? (
        assessments.map((a) => (
          <Card key={a.id} style={styles.itemCard}>
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>
                  {a.name} ({a.category})
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => editAssessment(a)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeAssessment(a.id)}
                  />
                </View>
              </View>
              <Text>Scheduled Days: {(a.scheduledDays || []).join(", ")}</Text>
              {(a.applicableCycles || []).length > 0 && (
                <Text>Cycles: {(a.applicableCycles || []).join(", ")}</Text>
              )}
              {a.requirements && <Text>Requirements: {a.requirements}</Text>}
              {a.fasting_required && (
                <Text>Fasting required: {String(a.fasting_required)}</Text>
              )}
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text>No assessments added</Text>
      )}
    </Card.Content>
  </Card>
);
