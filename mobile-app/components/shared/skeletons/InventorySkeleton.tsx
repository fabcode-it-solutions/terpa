import React from "react";
import { View, type ViewStyle } from "react-native";
import { ThemeView } from "@/components";
import { useColors } from "@/theme";

type SkeletonBlockProps = {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: ViewStyle;
};

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  height = 16,
  width = "100%",
  radius = 8,
  style,
}) => {
  const colors = useColors();
  return (
    <ThemeView
      style={[
        {
          height,
          width: typeof width === "number" ? width : undefined,
          borderRadius: radius,
          backgroundColor: colors.gray[200],
        },
        typeof width === "string" && width.includes("%") ? { width } : undefined,
        style,
      ]}
    />
  );
};

export const InventorySkeleton = () => {
  const colors = useColors();

  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 8,
        overflow: "hidden",
        borderColor: colors.border,
        backgroundColor: colors.background.paper,
      }}
    >
      {/* Header skeleton */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ gap: 4 }}>
          <SkeletonBlock height={24} width={120} />
          <SkeletonBlock height={16} width={80} />
        </View>
      </View>

      {/* Inventory list skeleton */}
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: i < 5 ? 1 : 0,
            borderBottomColor: colors.border,
          }}
        >
          {/* Product Image */}
          <SkeletonBlock height={40} width={40} radius={8} />

          {/* Product Info */}
          <View style={{ flex: 1, gap: 4 }}>
            {/* Line 1: Product Name */}
            <SkeletonBlock height={18} width="70%" />

            {/* Line 2: DEX, MDB, Cost */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SkeletonBlock height={12} width={60} />
              <SkeletonBlock height={12} width={60} />
              <SkeletonBlock height={12} width={50} />
            </View>

            {/* Line 3: Progress Bar */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SkeletonBlock height={12} width={50} />
              <View style={{ flex: 1 }}>
                <SkeletonBlock height={6} width="100%" radius={999} />
              </View>
              <SkeletonBlock height={12} width={35} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default InventorySkeleton;
