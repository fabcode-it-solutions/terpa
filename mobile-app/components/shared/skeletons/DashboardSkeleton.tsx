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

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  height = 16,
  width = "100%",
  radius = 8,
  style,
}) => {
  const colors = useColors();
  const blockStyle: ViewStyle = {
    height,
    width,
    borderRadius: radius,
    backgroundColor: colors.gray[200],
    ...(style ?? {}),
  };
  return <ThemeView style={blockStyle} />;
};

export const DashboardSkeleton = () => {
  const colors = useColors();

  return (
    <View>
      {/* Sales card skeleton */}
      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16, padding: 14 }}
      >
        <SkeletonBlock height={20} width={160} style={{ marginBottom: 12 }} />
        <SkeletonBlock height={28} width={200} style={{ alignSelf: "center", marginVertical: 8 }} />
        <SkeletonBlock height={18} width={220} style={{ alignSelf: "center", marginBottom: 8 }} />
        <SkeletonBlock height={18} width={220} style={{ alignSelf: "center" }} />
      </ThemeView>

      {/* Chart skeleton */}
      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16, padding: 14 }}
      >
        <SkeletonBlock height={16} width={100} style={{ marginBottom: 12 }} />
        <SkeletonBlock height={160} width="100%" radius={12} />
      </ThemeView>

      {/* Stat cards row skeleton */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
        <ThemeView
          rounded="md"
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <SkeletonBlock height={16} width={120} />
          <SkeletonBlock height={16} width={100} style={{ marginTop: 12 }} />
        </ThemeView>
        <ThemeView
          rounded="md"
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <SkeletonBlock height={16} width={120} />
          <SkeletonBlock height={16} width={100} style={{ marginTop: 12 }} />
        </ThemeView>
      </View>

      {/* Another stat row */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
        <ThemeView
          rounded="md"
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <SkeletonBlock height={16} width={120} />
          <SkeletonBlock height={16} width={100} style={{ marginTop: 12 }} />
        </ThemeView>
        <ThemeView
          rounded="md"
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <SkeletonBlock height={16} width={120} />
          <SkeletonBlock height={16} width={100} style={{ marginTop: 12 }} />
        </ThemeView>
      </View>

      {/* Top lists skeleton */}
      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16, padding: 14 }}
      >
        <SkeletonBlock height={18} width={180} style={{ marginBottom: 8 }} />
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
          >
            <SkeletonBlock height={10} width={10} radius={5} />
            <SkeletonBlock height={14} width={200} />
          </View>
        ))}
      </ThemeView>

      <ThemeView
        rounded="md"
        style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 16, padding: 14 }}
      >
        <SkeletonBlock height={18} width={200} style={{ marginBottom: 8 }} />
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
          >
            <SkeletonBlock height={40} width={40} radius={8} />
            <View style={{ flex: 1 }}>
              <SkeletonBlock height={14} width={200} />
              <SkeletonBlock height={12} width={140} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </ThemeView>
    </View>
  );
};

export default DashboardSkeleton;
