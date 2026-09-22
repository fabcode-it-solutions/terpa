import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors, useTheme } from "@/theme";
import { computeDropdownPosition } from "@/utils/ui/dropdown";

export type MachineOption = { id: string; name: string };

interface MachineFilterProps {
  machines?: MachineOption[];
  value?: string | undefined; // machineId or undefined for all
  onValueChange?: (machineId: string | undefined) => void;
  allLabel?: string;
  style?: ViewStyle;
}

const MachineFilter: React.FC<MachineFilterProps> = ({
  machines = [],
  value,
  onValueChange,
  allLabel = "Todas las máquinas",
  style,
}) => {
  const theme = useTheme();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View | null>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const options: (MachineOption & { key: string })[] = useMemo(() => {
    const list = [
      { id: "__all__", name: allLabel, key: "__all__" } as MachineOption & { key: string },
    ];
    for (const m of machines) list.push({ ...m, key: m.id });
    return list;
  }, [machines, allLabel]);

  const selectedLabel = useMemo(() => {
    if (!value) return allLabel;
    return machines.find((m) => m.id === value)?.name ?? allLabel;
  }, [value, machines, allLabel]);

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

  const handleSelect = (key: string) => {
    if (key === "__all__") onValueChange?.(undefined);
    else onValueChange?.(key);
    closeDropdown();
  };

  return (
    <View
      style={[{ position: "relative", marginBottom: theme.spacing.md }, style]}
      ref={triggerRef}
    >
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
          <ThemeText variant="body2" color={colors.text.secondary}>
            {selectedLabel}
          </ThemeText>
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
                    const pos = computeDropdownPosition(anchor, options.length);
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
                            {options.map((opt) => {
                              const isSelected = (value ?? "__all__") === opt.key;
                              return (
                                <TouchableOpacity
                                  key={opt.key}
                                  onPress={() => handleSelect(opt.key)}
                                  style={styles.optionRow}
                                >
                                  <ThemeText
                                    variant="body2"
                                    color={isSelected ? colors.text.primary : colors.text.secondary}
                                  >
                                    {opt.name}
                                  </ThemeText>
                                  {isSelected && (
                                    <MaterialIcons
                                      name="check"
                                      size={16}
                                      color={colors.text.primary}
                                    />
                                  )}
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

export default MachineFilter;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minWidth: 160,
  },
  chevrons: {
    flexDirection: "column",
    alignContent: "center",
    gap: 0,
    justifyContent: "center",
  },
  optionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
