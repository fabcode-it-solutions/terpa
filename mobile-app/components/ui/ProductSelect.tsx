import { ThemeText, ThemeTouchable } from "@/components/primitives";
import { useColors } from "@/theme";
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Box, ChevronDown, Search, X } from "lucide-react-native";
import { useProducts } from "@/hooks/queries/products";
import type { Product } from "@/services/api/schemas";
import * as Haptics from "expo-haptics";

interface ProductSelectProps {
  teamId: string;
  value: string | null;
  onChange: (productId: string) => void;
  error?: string;
  disabled?: boolean;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  teamId,
  value,
  onChange,
  error,
  disabled,
}) => {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: products, isLoading } = useProducts(teamId, {
    query: searchQuery,
  });

  const selectedProduct = products?.find((p) => p.id === value);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const handleSelect = useCallback(
    (product: Product) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onChange(product.id);
      handleClose();
    },
    [onChange, handleClose],
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => {
      const isSelected = item.id === value;
      return (
        <ThemeTouchable
          onPress={() => handleSelect(item)}
          style={[
            styles.productItem,
            {
              backgroundColor: isSelected ? colors.primary.light : colors.background.paper,
              borderColor: isSelected ? colors.primary.main : colors.border,
            },
          ]}
        >
          {item.images?.[0]?.url ? (
            <Image
              source={{ uri: item.images[0].url }}
              style={[styles.productImage, { backgroundColor: colors.gray[100] }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.productImage,
                styles.productImagePlaceholder,
                { backgroundColor: colors.gray[100] },
              ]}
            >
              <Box size={20} color={colors.text.secondary} />
            </View>
          )}
          <View style={styles.productInfo}>
            <ThemeText variant="body2" fontWeight={isSelected ? 600 : 500} numberOfLines={1}>
              {item.name}
            </ThemeText>
            <View style={styles.productMeta}>
              {item.sku && (
                <ThemeText variant="caption2" color={colors.text.secondary}>
                  SKU: {item.sku}
                </ThemeText>
              )}
              {item.price && (
                <ThemeText variant="caption2" color={colors.text.secondary}>
                  {item.price.valueFormatted}
                </ThemeText>
              )}
            </View>
          </View>
        </ThemeTouchable>
      );
    },
    [value, colors, handleSelect],
  );

  return (
    <>
      {/* Trigger Button */}
      <ThemeTouchable
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.red[500] : colors.border,
            backgroundColor: disabled ? colors.gray[50] : colors.background.paper,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {selectedProduct ? (
          <View style={styles.triggerContent}>
            {selectedProduct.images?.[0]?.url ? (
              <Image
                source={{ uri: selectedProduct.images[0].url }}
                style={[styles.triggerImage, { backgroundColor: colors.gray[100] }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.triggerImage,
                  styles.triggerImagePlaceholder,
                  { backgroundColor: colors.gray[100] },
                ]}
              >
                <Box size={16} color={colors.text.secondary} />
              </View>
            )}
            <ThemeText variant="body2" numberOfLines={1} style={styles.triggerText}>
              {selectedProduct.name}
            </ThemeText>
          </View>
        ) : (
          <ThemeText variant="body2" color={colors.text.hint}>
            Seleccionar producto
          </ThemeText>
        )}
        <ChevronDown size={20} color={colors.text.secondary} />
      </ThemeTouchable>

      {/* Modal for Product Selection */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.default }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemeText variant="h6" fontWeight={700}>
              Seleccionar Producto
            </ThemeText>
            <ThemeTouchable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text.secondary} />
            </ThemeTouchable>
          </View>

          {/* Search Input */}
          <View style={styles.searchWrapper}>
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.background.paper,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={20} color={colors.text.secondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar productos..."
                placeholderTextColor={colors.text.hint}
                style={[styles.searchInput, { color: colors.text.primary }]}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <ThemeTouchable onPress={() => setSearchQuery("")}>
                  <X size={16} color={colors.text.secondary} />
                </ThemeTouchable>
              )}
            </View>
          </View>

          {/* Product List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
          ) : products && products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.centerContainer}>
              <ThemeText variant="body2" color={colors.text.secondary}>
                {searchQuery ? "No se encontraron productos" : "No hay productos disponibles"}
              </ThemeText>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  triggerImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  triggerImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  triggerText: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  productImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productMeta: {
    flexDirection: "row",
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
