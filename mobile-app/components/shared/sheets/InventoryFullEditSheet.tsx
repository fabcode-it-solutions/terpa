import { ThemeText, ThemeTouchable } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { ProductSelect } from "@/components/ui/ProductSelect";
import { useColors } from "@/theme";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { InventoryRow } from "@/features/machine/hooks/useMachineInventoryVM";
import { useMachineInventoryVM } from "@/features/machine/hooks/useMachineInventoryVM";
import { useUpdateInventoryDetails } from "@/hooks/mutations/useInventoryMutations";
import { useMachineInventory } from "@/hooks/queries/vending";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { spiralEditSchema, type SpiralEditFormData } from "@/validation/inventory";
import { z } from "zod";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

interface InventoryFullEditSheetProps {
  item: InventoryRow;
  teamId: string;
  machineId: string;
  onClose: () => void;
}

interface FormErrors {
  machineCode?: string;
  machineMdbCode?: string;
  machineMicromarketCode?: string;
  productId?: string;
  maxCapacity?: string;
}

export const InventoryFullEditSheet: React.FC<InventoryFullEditSheetProps> = ({
  item,
  teamId,
  machineId,
  onClose,
}) => {
  const colors = useColors();
  const { t } = useTranslation();
  const updateDetailsMutation = useUpdateInventoryDetails(teamId, machineId, item.id);

  // Subscribe to live inventory data
  const { data } = useMachineInventory(teamId, machineId);
  const { inventoryData } = useMachineInventoryVM({ data });

  // Find the current item from live query data, fallback to prop
  const currentItem = inventoryData.find((i) => i.id === item.id) ?? item;

  // Form state - initialize with transformed values (null instead of "-")
  const [machineCode, setMachineCode] = useState<string>(
    currentItem.dexNumber && currentItem.dexNumber !== "-" ? currentItem.dexNumber : "",
  );
  const [machineMdbCode, setMachineMdbCode] = useState<string>(
    currentItem.mdbNumber && currentItem.mdbNumber !== "-" ? currentItem.mdbNumber : "",
  );
  const [machineMicromarketCode, setMachineMicromarketCode] = useState<string>(
    currentItem.micromarketCode ?? "",
  );
  const [productId, setProductId] = useState<string | null>(currentItem.productId ?? null);
  const [maxCapacity, setMaxCapacity] = useState<string>(currentItem.maxCapacity.toString());
  const [errors, setErrors] = useState<FormErrors>({});

  // Update form when live data changes
  useEffect(() => {
    setMachineCode(
      currentItem.dexNumber && currentItem.dexNumber !== "-" ? currentItem.dexNumber : "",
    );
    setMachineMdbCode(
      currentItem.mdbNumber && currentItem.mdbNumber !== "-" ? currentItem.mdbNumber : "",
    );
    setMachineMicromarketCode(currentItem.micromarketCode ?? "");
    setProductId(currentItem.productId ?? null);
    setMaxCapacity(currentItem.maxCapacity.toString());
  }, [currentItem]);

  const validateForm = (): boolean => {
    const formData: SpiralEditFormData = {
      spiralId: currentItem.id,
      machineId,
      teamId,
      machineCode: machineCode.trim() || null,
      machineMdbCode: machineMdbCode.trim() || null,
      machineMicromarketCode: machineMicromarketCode.trim() || null,
      productId: productId ?? "",
      maxCapacity: parseInt(maxCapacity.trim()),
      machineType: currentItem.machineType,
    };

    try {
      spiralEditSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!productId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors((prev) => ({ ...prev, productId: "Producto requerido" }));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateDetailsMutation.mutate(
      {
        machineCode: machineCode.trim() || null,
        machineMdbCode: machineMdbCode.trim() || null,
        machineMicromarketCode:
          currentItem.machineType === "MICROMARKET" ? machineMicromarketCode.trim() || null : null,
        productId,
        maxCapacity: parseInt(maxCapacity) || 0,
      },
      {
        onSuccess: () => {
          showSuccessToast(
            t("inventory.updateSuccess", { defaultValue: "Espiral actualizado exitosamente" }),
          );
          onClose();
        },
        onError: (error: unknown) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("inventory.updateError", { defaultValue: "Error al actualizar espiral" });
          showErrorToast(
            t("inventory.updateError", { defaultValue: "Error al actualizar espiral" }),
            errorMessage,
          );
        },
      },
    );
  };

  const isLoading = updateDetailsMutation.isPending;
  const isMicromarket = currentItem.machineType === "MICROMARKET";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemeText variant="h6" fontWeight={700}>
          {t("inventory.editSpiral", { defaultValue: "Editar Espiral" })}
        </ThemeText>
        <ThemeTouchable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          style={styles.closeButton}
          disabled={isLoading}
        >
          <X size={24} color={colors.text.secondary} />
        </ThemeTouchable>
      </View>

      {/* Scrollable Form */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Conditional Fields Based on Machine Type */}
        {isMicromarket ? (
          /* Micromarket Code */
          <View style={styles.fieldGroup}>
            <ThemeText variant="body2" fontWeight={600} style={styles.label}>
              {t("inventory.micromarketCode", { defaultValue: "Código de Producto" })}
            </ThemeText>
            <TextInput
              value={machineMicromarketCode}
              onChangeText={setMachineMicromarketCode}
              style={[
                styles.input,
                {
                  borderColor: errors.machineMicromarketCode ? colors.red[500] : colors.border,
                  color: colors.text.primary,
                  backgroundColor: isLoading ? colors.gray[50] : colors.background.paper,
                },
              ]}
              placeholderTextColor={colors.text.hint}
              keyboardType="default"
              editable={!isLoading}
            />
            {errors.machineMicromarketCode && (
              <ThemeText variant="caption2" color={colors.red[500]} style={styles.errorText}>
                {errors.machineMicromarketCode}
              </ThemeText>
            )}
            <ThemeText variant="caption2" color={colors.text.secondary} style={styles.helperText}>
              {t("inventory.micromarketHelp", {
                defaultValue: "Código del producto en el micromarket.",
              })}
            </ThemeText>
          </View>
        ) : (
          /* Vending Machine: DEX and MDB */
          <>
            {/* DEX Number */}
            <View style={styles.fieldGroup}>
              <ThemeText variant="body2" fontWeight={600} style={styles.label}>
                {t("inventory.dexNumber", { defaultValue: "Número DEX de Espiral" })}
              </ThemeText>
              <TextInput
                value={machineCode}
                onChangeText={setMachineCode}
                style={[
                  styles.input,
                  {
                    borderColor: errors.machineCode ? colors.red[500] : colors.border,
                    color: colors.text.primary,
                    backgroundColor: isLoading ? colors.gray[50] : colors.background.paper,
                  },
                ]}
                placeholderTextColor={colors.text.hint}
                keyboardType="default"
                editable={!isLoading}
              />
              {errors.machineCode && (
                <ThemeText variant="caption2" color={colors.red[500]} style={styles.errorText}>
                  {errors.machineCode}
                </ThemeText>
              )}
              <ThemeText variant="caption2" color={colors.text.secondary} style={styles.helperText}>
                {t("inventory.dexHelp", {
                  defaultValue: "Este es el número de espiral como aparece en la máquina.",
                })}
              </ThemeText>
            </View>

            {/* MDB Code */}
            <View style={styles.fieldGroup}>
              <ThemeText variant="body2" fontWeight={600} style={styles.label}>
                {t("inventory.mdbCode", { defaultValue: "Código MDB" })}
              </ThemeText>
              <TextInput
                value={machineMdbCode}
                onChangeText={setMachineMdbCode}
                style={[
                  styles.input,
                  {
                    borderColor: errors.machineMdbCode ? colors.red[500] : colors.border,
                    color: colors.text.primary,
                    backgroundColor: isLoading ? colors.gray[50] : colors.background.paper,
                  },
                ]}
                placeholderTextColor={colors.text.hint}
                keyboardType="default"
                editable={!isLoading}
              />
              {errors.machineMdbCode && (
                <ThemeText variant="caption2" color={colors.red[500]} style={styles.errorText}>
                  {errors.machineMdbCode}
                </ThemeText>
              )}
              <ThemeText variant="caption2" color={colors.text.secondary} style={styles.helperText}>
                {t("inventory.mdbHelp", {
                  defaultValue: "Este es el código de espiral como aparece en el sistema.",
                })}
              </ThemeText>
            </View>
          </>
        )}

        {/* Product Selector */}
        <View style={styles.fieldGroup}>
          <ThemeText variant="body2" fontWeight={600} style={styles.label}>
            {t("inventory.product", { defaultValue: "Producto" })}
          </ThemeText>
          <ProductSelect
            teamId={teamId}
            value={productId}
            onChange={setProductId}
            error={errors.productId}
            disabled={isLoading}
          />
          {errors.productId && (
            <ThemeText variant="caption2" color={colors.red[500]} style={styles.errorText}>
              {errors.productId}
            </ThemeText>
          )}
          <ThemeText variant="caption2" color={colors.text.secondary} style={styles.helperText}>
            {t("inventory.productHelp", {
              defaultValue: "Selecciona el producto que se venderá en esta espiral.",
            })}
          </ThemeText>
        </View>

        {/* Max Capacity (single field, currentCount removed) */}
        <View style={styles.fieldGroup}>
          <ThemeText variant="body2" fontWeight={600} style={styles.label}>
            {t("inventory.maxCapacity", { defaultValue: "Cantidad Máxima" })}
          </ThemeText>
          <TextInput
            value={maxCapacity}
            onChangeText={setMaxCapacity}
            style={[
              styles.input,
              {
                borderColor: errors.maxCapacity ? colors.red[500] : colors.border,
                color: colors.text.primary,
                backgroundColor: isLoading ? colors.gray[50] : colors.background.paper,
              },
            ]}
            placeholderTextColor={colors.text.hint}
            keyboardType="numeric"
            editable={!isLoading}
          />
          {errors.maxCapacity && (
            <ThemeText variant="caption2" color={colors.red[500]} style={styles.errorText}>
              {errors.maxCapacity}
            </ThemeText>
          )}
          <ThemeText variant="caption2" color={colors.text.secondary} style={styles.helperText}>
            {t("inventory.maxCapacityHelp", { defaultValue: "¿Cuantos productos caben?" })}
          </ThemeText>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          title={t("common.save", { defaultValue: "Guardar" })}
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
          variant="primary"
          style={{ backgroundColor: colors.text.primary }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
  },
  helperText: {
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
