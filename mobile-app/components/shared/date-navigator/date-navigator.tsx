import { useEffect, useMemo, useState } from "react";
import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";

interface DateNavigatorProps {
  date: string;
  onPrevious: () => void;
  onNext: () => void;
  onDateChange: (date: Date) => void;
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  showTodayButton?: boolean;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  date,
  onPrevious,
  onNext,
  onDateChange,
  value,
  minDate,
  maxDate,
}) => {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState<Date>(value ?? new Date());
  const [draftDate, setDraftDate] = useState<Date>(value ?? new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setDraftDate(value);
    }
  }, [value]);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftDate(selectedDate);
    }
  };

  const openPicker = () => {
    setDraftDate(selectedDate); // Initialize draft with current date
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const applyDate = () => {
    setSelectedDate(draftDate);
    onDateChange(draftDate);
    setShowPicker(false);
  };

  const minDateTimestamp = minDate?.getTime();
  const maxDateTimestamp = maxDate?.getTime();

  const canGoPrev = useMemo(() => {
    if (!minDateTimestamp) return true;
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    return prev.getTime() >= minDateTimestamp;
  }, [selectedDate, minDateTimestamp]);
  const canGoNext = useMemo(() => {
    if (!maxDateTimestamp) return true;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    return next.getTime() <= maxDateTimestamp;
  }, [selectedDate, maxDateTimestamp]);

  return (
    <>
      <View style={styles.headerRow}>
        <ThemeView
          style={[
            styles.navGroup,
            {
              borderColor: colors.border,
              backgroundColor: colors.background.elevated,
              gap: 0,
              borderWidth: 1,
            },
          ]}
          rounded="md"
        >
          <TouchableOpacity
            onPress={onPrevious}
            disabled={!canGoPrev}
            style={[
              styles.navIconBtn,
              {
                borderRightWidth: 1,
                borderColor: colors.border,
              },
            ]}
            accessibilityLabel="Previous"
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={canGoPrev ? colors.text.primary : colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={openPicker} style={styles.dateButton}>
            <ThemeText variant="body2" fontWeight={600}>
              {date}
            </ThemeText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            disabled={!canGoNext}
            style={[
              styles.navIconBtn,
              {
                borderLeftWidth: 1,
                borderColor: colors.border,
              },
            ]}
            accessibilityLabel="Next"
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={canGoNext ? colors.text.primary : colors.text.secondary}
            />
          </TouchableOpacity>
        </ThemeView>
      </View>

      {/* Date Picker Modal */}
      {showPicker && (
        <Modal transparent visible={showPicker} animationType="fade" onRequestClose={closePicker}>
          <TouchableWithoutFeedback onPress={closePicker}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerModal, { backgroundColor: colors.background.elevated }]}>
                  <RNDateTimePicker
                    value={draftDate}
                    mode="date"
                    is24Hour={true}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleDateChange}
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    locale="es-MX"
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity onPress={closePicker} style={styles.cancelButton}>
                      <ThemeText variant="body2" style={{ color: colors.text.secondary }}>
                        Cancelar
                      </ThemeText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={applyDate} style={styles.doneButton}>
                      <ThemeText variant="body2" fontWeight={600} style={{ color: "#007AFF" }}>
                        Listo
                      </ThemeText>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  navIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModal: {
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxWidth: 400,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
