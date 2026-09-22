import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from "react-native";
import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors } from "@/theme";
import { Images } from "@/assets";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  style?: ViewStyle;
}

function formatDateTimeLabel(d: Date) {
  // Format: "1 oct 2025 12:00am" using America/Monterrey timezone
  // Pattern: d MMM yyyy h:mma
  const formatted = format(d, "d MMM yyyy h:mma", { locale: es });
  return formatted.toLowerCase();
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  style,
}) => {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>(value);

  const open = () => {
    setDraftRange(value);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const apply = () => {
    const start = draftRange.start <= draftRange.end ? draftRange.start : draftRange.end;
    const end = draftRange.end >= draftRange.start ? draftRange.end : draftRange.start;
    onChange({ start, end });
    close();
  };

  const label = `${formatDateTimeLabel(value.start)} – ${formatDateTimeLabel(value.end)}`;

  const handleStartChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftRange({ ...draftRange, start: selectedDate });
    }
  };

  const handleEndChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftRange({ ...draftRange, end: selectedDate });
    }
  };

  return (
    <View style={[styles.row, style]}>
      <ThemeView
        style={[
          styles.chip,
          { borderColor: colors.border, backgroundColor: colors.background.elevated },
        ]}
        rounded="md"
      >
        <TouchableOpacity onPress={open}>
          <View style={styles.chipInner}>
            <Image source={Images.calendarc_icon} style={styles.image} />
            <ThemeText variant="body2" fontWeight={600}>
              {label}
            </ThemeText>
          </View>
        </TouchableOpacity>
      </ThemeView>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <TouchableWithoutFeedback onPress={close}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.background.elevated }]}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Start Date/Time Picker */}
                  <View style={styles.pickerSection}>
                    <ThemeText variant="body2" fontWeight={600} style={{ marginBottom: 12 }}>
                      Inicio
                    </ThemeText>
                    <RNDateTimePicker
                      value={draftRange.start}
                      mode="datetime"
                      is24Hour={true}
                      display={Platform.OS === "ios" ? "compact" : "default"}
                      onChange={handleStartChange}
                      minimumDate={minDate}
                      maximumDate={maxDate}
                      locale="es-MX"
                    />
                  </View>

                  {/* End Date/Time Picker */}
                  <View style={styles.pickerSection}>
                    <ThemeText variant="body2" fontWeight={600} style={{ marginBottom: 12 }}>
                      Fin
                    </ThemeText>
                    <RNDateTimePicker
                      value={draftRange.end}
                      mode="datetime"
                      is24Hour={true}
                      display={Platform.OS === "ios" ? "compact" : "default"}
                      onChange={handleEndChange}
                      minimumDate={minDate}
                      maximumDate={maxDate}
                      locale="es-MX"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={close} style={styles.cancelButton}>
                      <ThemeText variant="body2" style={{ color: colors.text.secondary }}>
                        Cancelar
                      </ThemeText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={apply} style={styles.applyButton}>
                      <ThemeText variant="body2" fontWeight={600} style={{ color: "#FFFFFF" }}>
                        Aplicar
                      </ThemeText>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default DateRangeFilter;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 999,
  },
  image: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  pickerSection: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
});
