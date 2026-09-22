import React from "react";
import { View, type ViewStyle } from "react-native";
import { ThemeView } from "@/components";
import { useColors } from "@/theme";

type BlockProps = {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: ViewStyle;
};

const Block = ({ height = 16, width = "100%", radius = 8, style = {} }: BlockProps) => {
  const colors = useColors();
  return (
    <ThemeView
      style={{ height, width, borderRadius: radius, backgroundColor: colors.gray[200], ...style }}
    />
  );
};

export default function ProductsSkeleton() {
  const colors = useColors();

  return (
    <View>
      {/* Header/search skeleton */}
      <Block height={40} style={{ marginBottom: 12 }} />

      {/* Table skeleton */}
      <ThemeView
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Block width={100} />
        </View>
        {/* Rows */}
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 12,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Block height={40} width={40} radius={8} />
            <View style={{ flex: 1 }}>
              <Block height={14} width={180} />
              <Block height={12} width={120} style={{ marginTop: 6 }} />
            </View>
            <Block height={14} width={60} />
          </View>
        ))}
      </ThemeView>
    </View>
  );
}
