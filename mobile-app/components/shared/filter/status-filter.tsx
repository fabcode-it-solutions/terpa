import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors } from "@/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from "react-native";
import { computeDropdownPosition } from "@/utils/ui/dropdown";
import type { MachineStatus } from "@/hooks/useMachineFilters";

interface StatusFilterProps {
  value?: MachineStatus;
  onValueChange?: (status: MachineStatus) => void;
  availableStatuses?: MachineStatus[];
}

const STATUS_LABELS: Record<MachineStatus, string> = {
  all: "Todos los estatus",
  online: "En Línea",
  warning: "Intermitente",
  offline: "Sin Conexión",
  noData: "Sin Datos",
};

const DEFAULT_STATUSES: MachineStatus[] = ["all", "online", "warning", "offline", "noData"];

const StatusFilter = ({
  value = "all",
  onValueChange,
  availableStatuses = DEFAULT_STATUSES,
}: StatusFilterProps) => {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View | null>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const selectedLabel = STATUS_LABELS[value];

  // Get status color from theme, or null for "all"
  const getStatusColor = (status: MachineStatus): string | null => {
    if (status === "all") return null;
    if (status === "online") return colors.success.main;
    if (status === "offline") return colors.error.main;
    if (status === "warning") return colors.warning.main;
    if (status === "noData") return colors.text.secondary;
    return null;
  };

  const openDropdown = () => {
    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow?.((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setOpen(true);
      });
    });
  };
  const closeDropdown = () => {
    setOpen(false);
    requestAnimationFrame(() => setAnchor(null));
  };
  const toggleDropdown = () => {
    if (open) closeDropdown();
    else openDropdown();
  };

  const handleSelect = (status: MachineStatus) => {
    onValueChange?.(status);
    setOpen(false);
  };

  return (
    <View style={{ position: "relative" }} ref={triggerRef}>
      {/* Trigger */}
      <TouchableOpacity activeOpacity={0.7} onPress={toggleDropdown}>
        <ThemeView
          style={[
            styles.trigger,
            {
              borderColor: colors.border,
              backgroundColor: colors.background.elevated,
            },
          ]}
        >
          <View style={styles.triggerContent}>
            {getStatusColor(value) && (
              <View style={[styles.indicator, { backgroundColor: getStatusColor(value)! }]} />
            )}
            <ThemeText variant="body2" color={colors.text.primary}>
              {selectedLabel}
            </ThemeText>
          </View>
          <View style={styles.chevrons}>
            <MaterialIcons
              style={{ marginBottom: -4 }}
              name="keyboard-arrow-up"
              size={16}
              color={colors.text.secondary}
            />
            <MaterialIcons
              style={{ marginTop: -4 }}
              name="keyboard-arrow-down"
              size={16}
              color={colors.text.secondary}
            />
          </View>
        </ThemeView>
      </TouchableOpacity>

      {/* Modal dropdown - scrollable and closes on outside press */}
      {open && (
        <Modal
          transparent
          visible={open && !!anchor}
          animationType={Platform.OS === "ios" ? "none" : "fade"}
          onRequestClose={closeDropdown}
          onDismiss={() => setAnchor(null)}
        >
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.06)" }}>
              <TouchableWithoutFeedback>
                {anchor &&
                  (() => {
                    const pos = computeDropdownPosition(anchor, availableStatuses?.length ?? 0);
                    return (
                      <View
                        style={{
                          position: "absolute",
                          top: pos.top,
                          left: pos.left,
                          width: pos.width,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: colors.background.paper,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            maxHeight: 360,
                            overflow: "hidden",
                          }}
                        >
                          <ScrollView>
                            {availableStatuses.map((item) => {
                              const isSelected = item === value;
                              const statusColor = getStatusColor(item);
                              return (
                                <TouchableOpacity
                                  key={item}
                                  onPress={() => handleSelect(item)}
                                  style={styles.optionRow}
                                >
                                  <View style={styles.optionContent}>
                                    <MaterialIcons
                                      name="check"
                                      size={16}
                                      color={colors.text.primary}
                                      style={{ opacity: isSelected ? 1 : 0 }}
                                    />
                                    {statusColor && (
                                      <View
                                        style={[styles.indicator, { backgroundColor: statusColor }]}
                                      />
                                    )}
                                    <ThemeText variant="body2" color={colors.text.primary}>
                                      {STATUS_LABELS[item]}
                                    </ThemeText>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      </View>
                    );
                  })()}
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

export default StatusFilter;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minWidth: 140,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chevrons: {
    flexDirection: "column",
    alignContent: "center",
    gap: 0,
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
    zIndex: 999,
  },
  optionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
