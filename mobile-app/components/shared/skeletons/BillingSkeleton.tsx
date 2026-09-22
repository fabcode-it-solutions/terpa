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

export default function BillingSkeleton() {
  const colors = useColors();

  return (
    <View>
      {/* Filters */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <Block height={40} width={130} />
        <Block height={40} width={130} />
        <Block height={40} width={130} />
      </View>

      {/* Summary cards */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
        <ThemeView
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            borderRadius: 8,
          }}
        >
          <Block width={140} />
          <Block height={24} width={80} style={{ marginTop: 12 }} />
        </ThemeView>
        <ThemeView
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            borderRadius: 8,
          }}
        >
          <Block width={140} />
          <Block height={24} width={80} style={{ marginTop: 12 }} />
        </ThemeView>
      </View>

      {/* Table skeleton */}
      <ThemeView
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}
      >
        {/* header */}
        <View
          style={{
            flexDirection: "row",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Block width={120} />
        </View>
        {/* rows */}
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              padding: 16,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Block width={180} />
            <Block width={120} />
            <Block width={100} />
          </View>
        ))}
      </ThemeView>
    </View>
  );
}
