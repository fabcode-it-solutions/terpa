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

export const TerminalSkeleton = () => {
  const colors = useColors();

  return (
    <View>
      {/* Terminal summary card skeleton */}
      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
      >
        {/* Total section */}
        <View style={{ paddingVertical: 20, paddingHorizontal: 16, gap: 4 }}>
          <SkeletonBlock height={20} width={180} />
          <SkeletonBlock height={32} width={200} />
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
              flexDirection: "row",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
              borderBottomWidth: i < 4 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            {/* Card icon */}
            <View style={{ paddingTop: 2 }}>
              <SkeletonBlock height={24} width={35} radius={4} />
            </View>

            {/* Content column */}
            <View style={{ flex: 1, gap: 4 }}>
              {/* Row 1: Method/Card number and Amount */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <SkeletonBlock height={18} width={140} />
                <SkeletonBlock height={18} width={80} />
              </View>

              {/* Row 2: Bank name */}
              <SkeletonBlock height={14} width={120} />

              {/* Row 3: Status and Time */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <SkeletonBlock height={14} width={70} />
                <SkeletonBlock height={14} width={8} radius={4} />
                <SkeletonBlock height={14} width={60} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default TerminalSkeleton;
