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

export default function MachineDetailSkeleton() {
  const colors = useColors();

  return (
    <View>
      {/* Title */}
      <Block height={28} width={220} style={{ marginBottom: 16 }} />

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[...Array(4)].map((_, i) => (
          <Block key={i} height={36} width={90} radius={8} />
        ))}
      </View>

      {/* Status + Inventory */}
      <View style={{ gap: 16, marginBottom: 16 }}>
        <ThemeView
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 }}
        >
          <Block width={160} />
          <Block width={120} style={{ marginTop: 8 }} />
        </ThemeView>
        <ThemeView
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 }}
        >
          <Block width={140} />
          <Block width={220} style={{ marginTop: 8 }} />
        </ThemeView>
      </View>

      {/* Amount cards */}
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
          <Block width={120} />
          <Block height={24} width={100} style={{ marginTop: 12 }} />
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
          <Block width={120} />
          <Block height={24} width={100} style={{ marginTop: 12 }} />
        </ThemeView>
      </View>

      {/* Info list */}
      <ThemeView
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 14,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Block width={140} />
          <Block width={24} height={24} radius={12} />
        </View>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Block height={20} width={20} radius={4} />
            <View style={{ flex: 1 }}>
              <Block height={12} width={140} />
              <Block height={12} width={100} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </ThemeView>

      {/* Chart */}
      <ThemeView
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 }}
      >
        <Block width={160} />
        <Block height={160} radius={12} style={{ marginTop: 12 }} />
      </ThemeView>
    </View>
  );
}
