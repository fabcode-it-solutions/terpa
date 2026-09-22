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

export const SalesSkeleton = () => {
  const colors = useColors();

  return (
    <View>
      {/* Sales card skeleton */}
      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
      >
        {/* Total section */}
        <View style={{ paddingVertical: 20, paddingHorizontal: 16, gap: 4 }}>
          <SkeletonBlock height={20} width={140} />
          <SkeletonBlock height={32} width={200} />
        </View>

        {/* Breakdown section */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 16, gap: 24 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonBlock height={16} width={80} />
            <SkeletonBlock height={20} width={100} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonBlock height={16} width={80} />
            <SkeletonBlock height={20} width={100} />
          </View>
        </View>
      </ThemeView>

      {/* Transaction list skeleton */}
      <View
        style={{
          marginTop: 4,
          borderWidth: 1,
          borderRadius: 8,
          overflow: "hidden",
          borderColor: colors.border,
          backgroundColor: colors.background.paper,
        }}
      >
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: "column",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 4,
              borderBottomWidth: i < 4 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            {/* Row 1: DEX and MDB codes */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SkeletonBlock height={12} width={60} />
              <SkeletonBlock height={12} width={8} radius={4} />
              <SkeletonBlock height={12} width={60} />
            </View>

            {/* Row 2: Product name and price */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <SkeletonBlock height={20} width={180} />
              <SkeletonBlock height={20} width={80} />
            </View>

            {/* Row 3: Payment method and date/time */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SkeletonBlock height={14} width={70} />
              <SkeletonBlock height={14} width={8} radius={4} />
              <SkeletonBlock height={14} width={160} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SalesSkeleton;
